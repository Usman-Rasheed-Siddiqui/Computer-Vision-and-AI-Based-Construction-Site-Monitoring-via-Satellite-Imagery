import os
import django

# Tell Django where your settings.py is
os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'backend.settings'
)

# Initialize Django
django.setup()

from django.contrib.auth.models import User

user = User.objects.get(username="usman@outlook.com")
user.set_password("Sanaaffan@123")
user.save()

print("Password updated successfully!")