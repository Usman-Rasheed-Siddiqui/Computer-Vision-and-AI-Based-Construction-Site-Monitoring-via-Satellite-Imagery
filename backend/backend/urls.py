from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from monitoring.views import RegisterView


urlpatterns = [

    path('admin/', admin.site.urls),

    # Authentication
    path(
        'api/auth/register/',
        RegisterView.as_view(),
        name='register'
    ),

    path(
        'api/auth/login/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    path(
        'api/auth/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    # Application APIs
    path('api/', include('monitoring.urls')),
]