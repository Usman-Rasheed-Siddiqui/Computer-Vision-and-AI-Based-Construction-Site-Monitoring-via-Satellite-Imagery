from django.core.management.base import BaseCommand

from monitoring.image_cache import IMAGE_CACHE_DAYS, run_housekeeping


class Command(BaseCommand):
    help = (
        f"Delete stored analysis/preview images older than {IMAGE_CACHE_DAYS} days "
        "and clear their database references. Safe to run at any time."
    )

    def handle(self, *args, **options):
        result = run_housekeeping()
        self.stdout.write(self.style.SUCCESS(
            f"Removed {result['files_removed']} file(s); "
            f"cleared references on {result['records_cleared']} record(s)."
        ))