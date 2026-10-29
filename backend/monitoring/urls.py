from django.urls import path
from . import api_views

urlpatterns = [
    # Keep your existing routes.
    path('db-check/', api_views.database_check, name='database-check'),
    path("sites/", api_views.SiteListCreateView.as_view(), name="site-list"),
    path("sites/<uuid:site_id>/", api_views.site_detail, name="site-detail"),
    path(
        "sites/<uuid:site_id>/progress/",
        api_views.site_progress,
        name="site-progress",
    ),
    path(
        "my-join-requests/",
        api_views.my_join_requests,
        name="my-join-requests",
    ),
    path(
        "incoming-access-requests/",
        api_views.incoming_access_requests,
        name="incoming-access-requests",
    ),
    path(
        "access-requests/<uuid:request_id>/decide/",
        api_views.decide_access_request,
        name="decide-access-request",
    ),
]
