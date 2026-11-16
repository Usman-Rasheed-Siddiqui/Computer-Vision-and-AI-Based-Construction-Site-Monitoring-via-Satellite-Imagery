# Computer Vision and AI-Based Construction Site Monitoring via Satellite Imagery

**Sightline** monitors construction progress by comparing satellite images of a site taken on different dates. A deep-learning change-detection model highlights what changed, estimates the affected area, and an AI analyst (Google Gemini) turns the results into plain-language insights, charts and downloadable PDF reports.

## Features

- **Accounts** – sign up, sign in (JWT), manage your profile.
- **Site registration** – register a site by its bounding-box coordinates and confirm it on a satellite preview before saving.
- **Access control** – other users request access with a Site ID; only the site owner can approve or reject.
- **Change detection** – compare two dates and get a change mask plus estimated changed area.
- **AI analysis** – Gemini writes a summary of the site's progress with charts.
- **Progress dashboard** – progress charts, a comparison table with the earlier and later dates, and the latest comparison.
- **Reports** – download a monitoring report as a PDF.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts, jsPDF |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database & storage | Supabase (PostgreSQL + Storage) |
| Change detection | PyTorch (CPU) model, checkpoint at `backend/monitoring/change_detection/model/best_ckpt.pt` |
| Satellite imagery | Esri World Imagery Wayback tiles (no API key needed) |
| AI analysis | Google Gemini (`google-genai`) |

## Project structure

```
.
├── backend/                 Django project
│   ├── manage.py
│   ├── requirements.txt
│   ├── backend/             settings, urls
│   └── monitoring/          API views, models, Gemini service,
│       ├── change_detection/    change-detection model + inference
│       └── image_retrieval/     satellite image download
├── frontend/                React + Vite app
├── .env.example             template for environment variables
└── README.md
```

## Prerequisites

- **Python 3.11 or newer**
- **Node.js 20 or newer** (with npm)
- A **Supabase** project (free tier is fine)
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

## 1. Set up the environment file (`.env`)

Both the backend and the frontend read **one** `.env` file, which lives in the **project root** (the same folder as this README, next to `backend/` and `frontend/`). The frontend is configured to look one folder up, so you do not need a separate `.env` inside `frontend/`.

Copy the template and fill it in:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Then edit `.env`:

```dotenv
# Database Configuration (Supabase PostgreSQL)
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.your-project-reference
DB_PASSWORD=your-database-password

# Supabase Configuration
SUPABASE_URL=https://your-project-reference.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key

# Frontend API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite,gemini-2.5-flash-lite
GEMINI_THINKING_LEVEL=low
GEMINI_TIMEOUT_SECONDS=60
```

### What to fill in, and where to find it

| Variable | What to put | Where to find it |
|----------|-------------|------------------|
| `DB_HOST` | Supabase pooler host | Supabase dashboard → **Connect** → connection string (Session pooler). Looks like `aws-0-<region>.pooler.supabase.com` |
| `DB_PORT` | Usually `5432` | Same connection string |
| `DB_NAME` | Usually `postgres` | Same connection string |
| `DB_USER` | `postgres.<your-project-reference>` | Same connection string |
| `DB_PASSWORD` | The database password you chose when creating the project | Reset it under **Project Settings → Database** if you forgot it |
| `SUPABASE_URL` | `https://<your-project-reference>.supabase.co` | **Project Settings → API** |
| `SUPABASE_SECRET_KEY` | The secret / service-role key | **Project Settings → API Keys**. Keep it private. |
| `VITE_API_BASE_URL` | Where the backend runs. Keep `http://127.0.0.1:8000/api` for local development | – |
| `GEMINI_API_KEY` | Your Gemini API key | [Google AI Studio](https://aistudio.google.com/) → **Get API key** |
| `GEMINI_MODEL` | Main model used for AI analysis | Any Gemini model your key can use |
| `GEMINI_FALLBACK_MODEL` | Comma-separated backup models, tried in order if the main one is overloaded or rate-limited | – |
| `GEMINI_THINKING_LEVEL` | `minimal`, `low`, `medium`, `high` or `default`. `low` is fastest for most models | – |
| `GEMINI_TIMEOUT_SECONDS` | Hard time limit for one AI request | – |

Optional tuning (defaults shown, add to `.env` only if you want to change them): `GEMINI_MAX_OUTPUT_TOKENS=4096`, `GEMINI_MAX_RECORDS=20`.

> **Important**
> - `GEMINI_API_KEY` is required for AI Analysis. Without it the analysis feature will not work.
> - Never commit `.env`. It contains secrets and is already in `.gitignore`. Commit only `.env.example`, with placeholder values.
> - Restart the backend and the frontend after changing `.env`; both read it at start-up.
> - Free-tier Gemini keys have low per-minute and per-day limits. If you hit them, change `GEMINI_MODEL` or rely on the fallback models.

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Storage:** create a bucket named exactly `temporary-site-previews`. The backend uses it for temporary satellite previews while a site is being registered.
3. **Database tables:** the application's own tables (sites, site members, access requests, analysis records) must exist in your Supabase database. Create them from the project's schema before first use.

## 3. Run the backend

From the project root:

```bash
cd backend

# create and activate a virtual environment
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Windows (cmd)
.venv\Scripts\activate.bat
# macOS / Linux
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt

# apply Django's built-in migrations
python manage.py migrate

# start the API server
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/api`.

Notes:
- `requirements.txt` installs the **CPU** build of PyTorch from the PyTorch package index, so no GPU is needed. The download is large, so the first install takes a while.
- The change-detection checkpoint `best_ckpt.pt` is included in the repository. If you delete it, change detection will not run.
- The backend only accepts browser requests (CORS) from `http://localhost:5173` and `http://127.0.0.1:5173`. If you run the frontend on another port or host, add it to `CORS_ALLOWED_ORIGINS` in `backend/backend/settings.py`.

## 4. Run the frontend

Open a **second terminal**, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, normally **http://localhost:5173**.

Other scripts:

```bash
npm run build     # type-check and create a production build in dist/
npm run preview   # serve the production build locally
npm run lint      # run ESLint
```

## Using the app

1. Open the landing page, then **Sign up** and **Sign in**.
2. **Register Site** – enter the site details and bounding-box coordinates, then confirm the satellite preview.
3. **Join Live Site** – enter another site's ID, press **Check** to confirm the site name and location, then request access. The owner approves or rejects it.
4. Open **My Sites** → a site to run a comparison, view progress charts, run **AI Analysis** and download a **PDF report**.

## Troubleshooting

| Problem | Likely cause and fix |
|---------|---------------------|
| Frontend shows network errors | Backend not running, or `VITE_API_BASE_URL` is wrong. Restart `npm run dev` after editing `.env`. |
| Browser shows a CORS error | The frontend is running on a port that is not in `CORS_ALLOWED_ORIGINS`. |
| Database connection errors | Check `DB_HOST`, `DB_USER`, `DB_PASSWORD`. Use the **pooler** connection string from Supabase. |
| "Supabase client is not initialized" | `SUPABASE_URL` or `SUPABASE_SECRET_KEY` is missing in `.env`. |
| Preview or upload fails | The `temporary-site-previews` storage bucket does not exist. |
| AI Analysis fails with 429 | Gemini free-tier quota reached. Wait, or use a different `GEMINI_MODEL`. |
| AI Analysis fails with 503 | The model is overloaded. The fallback models in `GEMINI_FALLBACK_MODEL` are tried automatically. |
| A `.env` change has no effect | A system-level environment variable with the same name may be overriding it. Remove it and restart. |

## Security

- Keep `.env` out of version control and never share the Supabase secret key or Gemini API key.
- If a key is ever pushed to GitHub by mistake, rotate it immediately in the Supabase or Google AI Studio dashboard.

## Team

Developed as a university project at NED University of Engineering & Technology, Karachi.