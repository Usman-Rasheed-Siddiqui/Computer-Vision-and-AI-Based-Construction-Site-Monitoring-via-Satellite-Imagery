"""
10-day reuse of analysis images (NFR SCA-02), without any extra table.

How it works
------------
* Every finished analysis already stores four images in Supabase Storage and
  references them in its `progress_logs` row (baseline, latest, mask, overlay).
* A repeat of the same comparison is recognised by: the same site, the same two
  imagery release dates, and the same processing settings (threshold, site
  extent, model file). The settings fingerprint is written into the storage
  folder name, so a change of settings or model never matches an old result.
* If a matching result is younger than IMAGE_CACHE_DAYS, its stored images are
  loaded again instead of downloading satellite tiles and re-running the model.
* Images older than IMAGE_CACHE_DAYS are deleted from storage and their
  references cleared. The numeric results (area, percentage, dates) stay in
  the database, so progress charts and history keep working.
"""
import hashlib
import io
from datetime import timedelta
from pathlib import Path

from django.db.models import Q
from django.utils import timezone
from PIL import Image

from .models import ProgressLogs
from .image_retrieval.image_retrieval import supabase, BUCKET_NAME, pick_release

IMAGE_CACHE_DAYS = 10

_CHECKPOINT = Path(__file__).resolve().parent / "change_detection" / "model" / "best_ckpt.pt"

IMAGE_FIELDS = (
    "baseline_image_filename",
    "latest_image_filename",
    "change_mask_filename",
    "overlay_image_filename",
)


def settings_tag(threshold, extent_meters) -> str:
    """Short fingerprint of everything that changes a result besides the imagery."""
    try:
        stat = _CHECKPOINT.stat()
        model_part = f"{stat.st_size}-{int(stat.st_mtime)}"
    except OSError:
        model_part = "nomodel"
    raw = f"{threshold}|{extent_meters}|{model_part}"
    return hashlib.sha1(raw.encode()).hexdigest()[:8]


def release_date_for(target_date) -> str | None:
    """Date of the imagery release that would be used for `target_date`."""
    try:
        return pick_release(target_date.isoformat())["date"]
    except Exception:
        return None


def find_cached_analysis(site, earlier_release_date, later_release_date, tag):
    """Newest completed analysis of this exact comparison whose images are still stored."""
    cutoff = timezone.now() - timedelta(days=IMAGE_CACHE_DAYS)
    return (
        ProgressLogs.objects.filter(
            construction=site,
            earlier_date=earlier_release_date,
            later_date=later_release_date,
            status="completed",
            processed_at__gte=cutoff,
            baseline_image_filename__endswith=f"-{tag}/baseline.jpg",
            latest_image_filename__isnull=False,
            change_mask_filename__isnull=False,
            overlay_image_filename__isnull=False,
            area_changed_sqm__isnull=False,
            change_percentage__isnull=False,
        )
        .order_by("-processed_at")
        .first()
    )


def signed_url(path, expires_in=3600):
    response = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        path=path, expires_in=expires_in
    )
    return response.get("signedURL") or response.get("signedUrl")


def _imagery_info(release_date, latitude, extent_meters, size):
    """Same fields a fresh download reports, rebuilt for a cached image."""
    import math

    release = pick_release(str(release_date))
    zoom = 19 if extent_meters <= 250 else 18
    mpp = 156543.03392 * math.cos(math.radians(latitude)) / (2 ** zoom)
    return {
        "release_date": release["date"],
        "release_id": release["num"],
        "zoom": zoom,
        "center_mpp": round(mpp, 3),
        "size_px": list(size),
        "tiles_fetched": 0,
        "missing_tiles": 0,
        "from_cache": True,
    }


def load_cached_analysis(log, latitude, extent_meters):
    """Everything the analysis response needs, rebuilt from a stored result."""
    storage = supabase.storage.from_(BUCKET_NAME)

    baseline = Image.open(io.BytesIO(storage.download(log.baseline_image_filename)))
    mask = Image.open(io.BytesIO(storage.download(log.change_mask_filename)))

    total_pixels = mask.size[0] * mask.size[1]
    changed_pixels = round(total_pixels * float(log.change_percentage) / 100)

    return {
        "images": {
            "baseline": signed_url(log.baseline_image_filename),
            "latest": signed_url(log.latest_image_filename),
            "mask": signed_url(log.change_mask_filename),
            "overlay": signed_url(log.overlay_image_filename),
        },
        "changed_pixels": changed_pixels,
        "total_pixels": total_pixels,
        "earlier_info": _imagery_info(log.earlier_date, latitude, extent_meters, baseline.size),
        "later_info": _imagery_info(log.later_date, latitude, extent_meters, baseline.size),
    }


def purge_expired_images(limit=100) -> int:
    """
    Delete stored images older than IMAGE_CACHE_DAYS and clear their references.
    Never raises: housekeeping must not break an analysis. Returns rows cleaned.
    """
    if not supabase:
        return 0

    cleaned = 0
    try:
        cutoff = timezone.now() - timedelta(days=IMAGE_CACHE_DAYS)
        has_image = Q()
        for field in IMAGE_FIELDS:
            has_image |= Q(**{f"{field}__isnull": False})

        expired = ProgressLogs.objects.filter(has_image, processed_at__lt=cutoff)[:limit]

        for log in expired:
            paths = [getattr(log, f) for f in IMAGE_FIELDS if getattr(log, f)]
            try:
                supabase.storage.from_(BUCKET_NAME).remove(paths)
            except Exception as error:
                print(f"Image purge: could not remove files for {log.progress_id}: {error}")
                continue

            for field in IMAGE_FIELDS:
                setattr(log, field, None)
            log.save(update_fields=list(IMAGE_FIELDS))
            cleaned += 1
    except Exception as error:
        print(f"Image purge failed: {error}")

    return cleaned


# ---------------------------------------------------------------------------
# Storage sweep: removes ANY stored file older than IMAGE_CACHE_DAYS, including
# files the database no longer points to (abandoned site previews, files left by
# a failed analysis). This is what guarantees "up to 10 days" for everything in
# the bucket, not only for finished analyses.
# ---------------------------------------------------------------------------
import threading
import time
from datetime import datetime

_PAGE = 100


def _list_folder(storage, prefix):
    """Every entry directly inside `prefix` (handles Supabase's paged listing)."""
    offset = 0
    while True:
        page = storage.list(prefix, {"limit": _PAGE, "offset": offset}) or []
        yield from page
        if len(page) < _PAGE:
            return
        offset += _PAGE


def _walk_files(storage, prefix=""):
    """Yield (full_path, created_at) for every file below `prefix`."""
    for entry in _list_folder(storage, prefix):
        name = entry.get("name")
        if not name:
            continue
        path = f"{prefix}/{name}" if prefix else name
        if entry.get("id") is None:  # folders have no id
            yield from _walk_files(storage, path)
        else:
            yield path, entry.get("created_at")


def sweep_storage() -> int:
    """Delete every file in the bucket older than IMAGE_CACHE_DAYS. Never raises."""
    if not supabase:
        return 0

    removed = 0
    try:
        cutoff = timezone.now() - timedelta(days=IMAGE_CACHE_DAYS)
        storage = supabase.storage.from_(BUCKET_NAME)

        old_paths = []
        for path, created_at in _walk_files(storage):
            if not created_at:
                continue
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            if created < cutoff:
                old_paths.append(path)

        for i in range(0, len(old_paths), 100):
            batch = old_paths[i:i + 100]
            storage.remove(batch)
            removed += len(batch)
    except Exception as error:
        print(f"Storage sweep failed: {error}")

    return removed


def run_housekeeping() -> dict:
    """Full 10-day clean-up: stored files first, then the database references."""
    swept = sweep_storage()
    cleared = purge_expired_images(limit=1000)
    return {"files_removed": swept, "records_cleared": cleared}


_last_run = 0.0
_lock = threading.Lock()
_MIN_GAP_SECONDS = 30 * 60


def run_housekeeping_if_due() -> None:
    """Run the clean-up at most once every 30 minutes; safe to call on every request."""
    global _last_run
    with _lock:
        if time.time() - _last_run < _MIN_GAP_SECONDS:
            return
        _last_run = time.time()

    def work():
        try:
            run_housekeeping()
        except Exception as error:
            print(f"Housekeeping failed: {error}")

    # In a background thread so the user's request is never slowed down.
    threading.Thread(target=work, name="image-housekeeping", daemon=True).start()


def start_cleanup_scheduler(interval_minutes=60) -> None:
    """Background thread that runs the clean-up on a timer while the server is up."""
    def loop():
        time.sleep(60)  # let the server finish starting
        while True:
            run_housekeeping_if_due()
            time.sleep(interval_minutes * 60)

    threading.Thread(target=loop, name="image-cleanup", daemon=True).start()