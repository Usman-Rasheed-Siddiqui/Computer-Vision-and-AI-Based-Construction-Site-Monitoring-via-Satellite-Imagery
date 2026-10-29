from django.urls import path
from monitoring.api_views import database_check

urlpatterns = [
    # Keep your existing routes.
    path('db-check/', database_check, name='database-check'),
]