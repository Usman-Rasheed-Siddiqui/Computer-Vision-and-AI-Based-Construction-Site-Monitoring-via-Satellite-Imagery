import io
import json
import math
import os
import re
import shutil
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
from PIL import Image
from requests.adapters import HTTPAdapter
from dotenv import load_dotenv
from supabase import create_client, Client

# --- 1. LOAD .ENV FROM ROOT FOLDER ---
ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")

BUCKET_NAME = "temporary-site-previews"

# --- 2. CONFIG & CACHE PATHS ---
CONFIG_URL = "https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json"

CACHE = Path(__file__).resolve().parent / "wayback_cache"
CACHE.mkdir(exist_ok=True, parents=True)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "student-srs-project"})
SESSION.mount("https://", HTTPAdapter(pool_connections=32, pool_maxsize=32))

_releases = None

def releases():
    """Release catalog, cached in memory and on disk for 24 h."""
    global _releases
    if _releases:
        return _releases
    
    f = CACHE / "config.json"
    if f.exists() and time.time() - f.stat().st_mtime < 86400:
        try:
            cfg = json.loads(f.read_text())
        except Exception:
            cfg = SESSION.get(CONFIG_URL, timeout=30).json()
            f.write_text(json.dumps(cfg))
    else:
        cfg = SESSION.get(CONFIG_URL, timeout=30).json()
        f.write_text(json.dumps(cfg))
        
    out = []
    for num, item in cfg.items():
        m = re.search(r"\d{4}-\d{2}-\d{2}", item["itemTitle"])
        if m:
            out.append({"num": int(num), "date": m.group(), "url": item["itemURL"]})
            
    _releases = sorted(out, key=lambda r: (r["date"], r["num"]))
    return _releases

def pick_release(target):
    """Latest release on or before 'YYYY-MM-DD' (else the earliest one)."""
    rels = releases()
    before = [r for r in rels if r["date"] <= target]
    return before[-1] if before else rels[0]

def fetch_tile(rel, z, x, y):
    p = CACHE / str(rel["num"]) / str(z) / f"{x}_{y}.jpg"
    
    if p.exists():
        return p.read_bytes()
            
    url = rel["url"].format(level=z, row=y, col=x)
    
    for attempt in range(4):
        try:
            r = SESSION.get(url, timeout=15)
            if r.status_code == 200:
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes(r.content)
                return r.content
            elif r.status_code == 404:
                return None
        except requests.RequestException:
            time.sleep(1 + attempt)
            
    return None

def clear_wayback_cache():
    """Keeps the wayback_cache directory itself, but deletes everything inside it."""
    try:
        for item in CACHE.iterdir():
            if item.name == "config.json":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        print("wayback_cache contents successfully cleared.")
    except Exception as e:
        print(f"Warning: Failed to clear wayback_cache contents: {e}")

def get_image(target_date, lat, lon, extent_m, zoom=None, workers=16):
    """Fetches tiles, stitches them, crops the exact box, and clears the cache contents."""
    if not 1 <= extent_m <= 1000:
        raise ValueError("extent_m must be between 1 and 1000")
        
    z = zoom or (19 if extent_m <= 250 else 18)
    rel = pick_release(target_date)

    # 1. Calculate true ground bounding box in degrees
    m_per_deg = 111320.0
    d_lat = (extent_m / 2) / m_per_deg
    d_lon = (extent_m / 2) / (m_per_deg * math.cos(math.radians(lat)))

    lat_max, lat_min = lat + d_lat, lat - d_lat
    lon_max, lon_min = lon + d_lon, lon - d_lon

    # 2. Project geographic coordinates directly to Web Mercator pixels
    world = 256 * (2 ** z)
    
    def lat_to_y(l):
        return (1 - math.asinh(math.tan(math.radians(l))) / math.pi) / 2 * world

    def lon_to_x(l):
        return (l + 180) / 360 * world

    left = lon_to_x(lon_min)
    right = lon_to_x(lon_max)
    top = lat_to_y(lat_max)    
    bottom = lat_to_y(lat_min) 

    # 3. Compute grid boundaries and fetch tiles
    x0, x1 = int(left // 256), int(right // 256)
    y0, y1 = int(top // 256), int(bottom // 256)
    coords = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]

    with ThreadPoolExecutor(workers) as pool:
        tiles = list(pool.map(lambda c: fetch_tile(rel, z, *c), coords))

    # 4. Stitch and Crop
    mosaic = Image.new("RGB", ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    missing = 0
    for (x, y), data in zip(coords, tiles):
        if data is None:
            missing += 1
            continue
        try:
            tile_img = Image.open(io.BytesIO(data)).convert("RGB")
            mosaic.paste(tile_img, ((x - x0) * 256, (y - y0) * 256))
        except Exception:
            missing += 1

    box = (
        round(left - x0 * 256),
        round(top - y0 * 256),
        round(right - x0 * 256),
        round(bottom - y0 * 256)
    )
    img = mosaic.crop(box)

    # --- WIPE WAYBACK CACHE CONTENTS ---
    clear_wayback_cache()

    mpp = 156543.03392 * math.cos(math.radians(lat)) / (2 ** z)
    info = {
        "release_date": rel["date"], 
        "release_id": rel["num"],
        "zoom": z, 
        "center_mpp": round(mpp, 3),
        "size_px": img.size, 
        "tiles_fetched": len(coords), 
        "missing_tiles": missing
    }
    return img, info

def upload_temporary_preview(img: Image.Image, site_id: str) -> str:
    if not supabase:
        raise RuntimeError(
            "Supabase is not initialized. Check SUPABASE_URL and SUPABASE_SECRET_KEY."
        )

    file_path = f"previews/{site_id}_{int(time.time())}.jpg"

    image_file = io.BytesIO()
    img.convert("RGB").save(image_file, format="JPEG", quality=90)
    file_bytes = image_file.getvalue()  # Extract raw bytes for the uploader

    try:
        response = (
            supabase.storage
            .from_(BUCKET_NAME)
            .upload(
                file=file_bytes,  # Pass raw bytes here instead of BytesIO
                path=file_path,
                file_options={
                    "content-type": "image/jpeg",
                    "cache-control": "3600",
                    "upsert": "false",
                },
            )
        )
        print("Upload response:", response)
    except Exception as e:
        print(f"Error uploading {file_path}: {e}")
        raise

    signed_url_data = (
        supabase.storage
        .from_(BUCKET_NAME)
        .create_signed_url(path=file_path, expires_in=300)
    )
    return signed_url_data["signedURL"]

if __name__ == "__main__":
    if not supabase:
        raise RuntimeError("Supabase client is not initialized; check your .env values.")

    img, info = get_image("2024-06-30", 24.95951, 46.70443, 500)
    
    signed_url = upload_temporary_preview(img, "test-site-123")
    print("Uploaded preview URL:", signed_url)
    print("Image Info:", info)