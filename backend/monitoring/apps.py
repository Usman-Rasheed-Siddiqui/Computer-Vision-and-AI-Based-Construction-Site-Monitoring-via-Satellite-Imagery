import os
import sys

from django.apps import AppConfig


class MonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'monitoring'

    def ready(self):
        """Start the 10-day image clean-up timer when the web server runs."""
        interval = int(os.getenv("IMAGE_CLEANUP_INTERVAL_MINUTES", "60"))
        if interval <= 0:
            return  # clean-up timer disabled; use the management command instead

        argv = " ".join(sys.argv)
        is_runserver = "runserver" in argv
        # `runserver` starts two processes when auto-reload is on; only the
        # child (RUN_MAIN=true) serves requests, so start the timer there.
        runserver_ok = is_runserver and (os.environ.get("RUN_MAIN") == "true" or "--noreload" in argv)
        wsgi_server = any(name in argv for name in ("gunicorn", "uwsgi", "daphne", "uvicorn"))

        if runserver_ok or wsgi_server:
            from .image_cache import start_cleanup_scheduler
            start_cleanup_scheduler(interval)