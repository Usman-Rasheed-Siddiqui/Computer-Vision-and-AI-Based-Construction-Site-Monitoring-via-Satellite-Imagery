from django.urls import path
from . import views

urlpatterns = [

    path('sites/preview-satellite/', views.PreviewSatelliteView.as_view(), name='preview-satellite'),
    path('sites/confirm-register/', views.ConfirmRegisterSiteView.as_view(), name='confirm-register'),
    path('sites/discard-preview/', views.DiscardPreviewView.as_view(), name='discard-preview'),

    path(
        'db-check/',
        views.database_check,
        name='database-check'
    ),

    path(
        'sites/',
        views.SiteListCreateView.as_view(),
        name='site-list'
    ),

    path(
        'sites/<uuid:site_id>/',
        views.site_detail,
        name='site-detail'
    ),

    path(
        'sites/<uuid:site_id>/progress/',
        views.site_progress,
        name='site-progress'
    ),

    path(
        'my-join-requests/',
        views.my_join_requests,
        name='my-join-requests'
    ),

    path(
        'incoming-access-requests/',
        views.incoming_access_requests,
        name='incoming-access-requests'
    ),

    path(
        'access-requests/<uuid:request_id>/decide/',
        views.decide_access_request,
        name='decide-access-request'
    ),

    path(
            'sites/<uuid:site_id>/update/',
            views.update_site_metadata,
            name='update-site-metadata'
        ),

    path(
        "change-detection/test/",
        views.TestChangeDetectionView.as_view(),
        name="test-change-detection"
    ),

    path(
        "sites/<uuid:site_id>/progress/analyze/",
        views.SiteProgressAnalysisView.as_view(),
        name="site-progress-analyze"
    ),

]