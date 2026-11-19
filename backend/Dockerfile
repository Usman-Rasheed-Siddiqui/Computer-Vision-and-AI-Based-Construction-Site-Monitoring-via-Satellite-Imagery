# Django backend image for Google Cloud Run.
# Build from the backend/ folder:   docker build -t sightline-backend backend
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8080

# Same layout as the repository (/app/backend), so paths the code derives
# from its own location (BASE_DIR.parent / ".env", parents[3]) resolve to /app.
# There is no .env in the image: all configuration comes from environment
# variables set on the Cloud Run service.
WORKDIR /app/backend

# Dependencies first, so code changes don't invalidate this layer.
# torch==...+cpu is only published on the PyTorch CPU index.
COPY requirements.txt .
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

COPY . .

# Static files for the admin / DRF browsable API, served by WhiteNoise.
RUN python manage.py collectstatic --noinput

# Run as an unprivileged user (needs write access for the imagery tile cache).
RUN useradd --create-home --uid 10001 app && chown -R app:app /app
USER app

EXPOSE 8080

# Shell form so $PORT (set by Cloud Run, default 8080) is expanded.
CMD exec gunicorn backend.wsgi:application --workers 1 --threads 4 --timeout 300 --bind 0.0.0.0:$PORT
