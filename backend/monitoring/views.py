from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework import generics, permissions
from .serializers import RegisterSerializer
from rest_framework.views import APIView
from datetime import date
from django.db import connection
from monitoring.models import Users

import json
import uuid

from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import (
    Users,
    ConstructionSites,
    SiteAccessRequest,
    UserSite,
    ProgressLogs,
)
from .serializers import (
    ConstructionSiteSerializer,
    SiteAccessRequestSerializer,
    ProgressLogSerializer,
)

from monitoring.image_retrieval.image_retrieval import get_image, upload_temporary_preview, supabase, BUCKET_NAME

@api_view(['GET'])
@permission_classes([AllowAny])
def database_check(request):
    try:
        site_count = ConstructionSites.objects.count()

        return Response({
            'status': 'success',
            'message': 'Django is connected to the sites table.',
            'site_count': site_count,
        })

    except Exception:
        return Response(
            {
                'status': 'error',
                'message': 'Could not read the sites table.',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

def get_profile_user(request):
    """Map the authenticated Django account to the existing users row."""
    email = getattr(request.user, "email", "")
    if not email:
        return None
    return Users.objects.filter(email__iexact=email).first()


class SiteListCreateView(generics.ListCreateAPIView):
    serializer_class = ConstructionSiteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = get_profile_user(self.request)
        if not profile:
            return ConstructionSites.objects.none()

        return ConstructionSites.objects.filter(
            Q(created_by=profile) |
            Q(usersite__user=profile)
        ).distinct().order_by("-created_at")

    def create(self, request, *args, **kwargs):
        profile = get_profile_user(request)
        if not profile:
            return Response(
                {"detail": "No matching profile exists in the users table."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        site = serializer.save(
            construction_id=uuid.uuid4(),
            created_by=profile,
        )

        # The creator automatically receives site membership.
        UserSite.objects.create(
            user_site_id=uuid.uuid4(),
            user=profile,
            construction=site,
        )

        return Response(
            self.get_serializer(site).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def site_detail(request, site_id):
    profile = get_profile_user(request)
    if not profile:
        return Response({"detail": "User profile not found."},
                        status=status.HTTP_403_FORBIDDEN)

    site = get_object_or_404(
        ConstructionSites.objects.filter(
            Q(created_by=profile) | Q(usersite__user=profile)
        ).distinct(),
        construction_id=site_id,
    )
    return Response(ConstructionSiteSerializer(site).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def site_progress(request, site_id):
    profile = get_profile_user(request)
    if not profile:
        return Response({"detail": "User profile not found."},
                        status=status.HTTP_403_FORBIDDEN)

    site = get_object_or_404(
        ConstructionSites.objects.filter(
            Q(created_by=profile) | Q(usersite__user=profile)
        ).distinct(),
        construction_id=site_id,
    )

    logs = ProgressLogs.objects.filter(
        construction=site
    ).order_by("-satellite_image_date")

    return Response(ProgressLogSerializer(logs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_join_requests(request):
    profile = get_profile_user(request)
    if not profile:
        return Response({"detail": "User profile not found."},
                        status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        requests = SiteAccessRequest.objects.filter(
            request_from=profile
        ).order_by("-created_at")
        return Response(
            SiteAccessRequestSerializer(requests, many=True).data
        )

    site_id = request.data.get("site_id")
    if not site_id:
        return Response({"detail": "site_id is required."},
                        status=status.HTTP_400_BAD_REQUEST)

    site = get_object_or_404(ConstructionSites, construction_id=site_id)

    if site.created_by_id == profile.user_id:
        return Response({"detail": "You already own this site."},
                        status=status.HTTP_400_BAD_REQUEST)

    if UserSite.objects.filter(user=profile, construction=site).exists():
        return Response({"detail": "You already have access."},
                        status=status.HTTP_400_BAD_REQUEST)

    if SiteAccessRequest.objects.filter(
        request_from=profile,
        construction=site,
        status__iexact="pending",
    ).exists():
        return Response({"detail": "A pending request already exists."},
                        status=status.HTTP_400_BAD_REQUEST)

    if not site.created_by:
        return Response({"detail": "This site has no assigned owner."},
                        status=status.HTTP_400_BAD_REQUEST)

    access_request = SiteAccessRequest.objects.create(
        request_id=uuid.uuid4(),
        request_from=profile,
        request_to=site.created_by,
        construction=site,
        status="pending",
    )
    return Response(
        SiteAccessRequestSerializer(access_request).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def incoming_access_requests(request):
    profile = get_profile_user(request)
    if not profile:
        return Response({"detail": "User profile not found."},
                        status=status.HTTP_403_FORBIDDEN)

    requests = SiteAccessRequest.objects.filter(
        request_to=profile,
        status__iexact="pending",
    ).order_by("-created_at")

    return Response(
        SiteAccessRequestSerializer(requests, many=True).data
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decide_access_request(request, request_id):
    profile = get_profile_user(request)
    if not profile:
        return Response({"detail": "User profile not found."},
                        status=status.HTTP_403_FORBIDDEN)

    access_request = get_object_or_404(
        SiteAccessRequest,
        request_id=request_id,
        request_to=profile,
        status__iexact="pending",
    )

    action = request.data.get("action")
    if action not in ["accept", "reject"]:
        return Response(
            {"detail": "action must be 'accept' or 'reject'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if action == "accept":
        UserSite.objects.get_or_create(
            user=access_request.request_from,
            construction=access_request.construction,
            defaults={"user_site_id": uuid.uuid4()},
        )
        access_request.status = "accepted"
    else:
        access_request.status = "rejected"

    access_request.save(update_fields=["status"])

    return Response(SiteAccessRequestSerializer(access_request).data)

class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class PreviewSatelliteView(APIView):
    permission_classes = [IsAuthenticated] # Ensures user is logged in via JWT

    def post(self, request):
        data = request.data
        try:
            latitude = float(data.get("latitude"))
            longitude = float(data.get("longitude"))
            extent_meters = int(data.get("extent_meters", 500))
            
            target_date = date.today().strftime("%Y-%m-%d")
            temp_site_id = str(uuid.uuid4())
            
            img, info = get_image(
                target_date=target_date,
                lat=latitude,
                lon=longitude,
                extent_m=extent_meters
            )
            
            file_path_relative = f"previews/{temp_site_id}_{target_date}.jpg"
            signed_url = upload_temporary_preview(img, temp_site_id)
            
            return Response({
                "signed_url": signed_url,
                "file_path": file_path_relative,
                "target_date_used": target_date,
                "info": info
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("Preview Error:", str(e))
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmRegisterSiteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        try:
            site_name = data.get("site_name")
            start_date = data.get("start_date")
            location = data.get("location")
            city = data.get("city")
            country = data.get("country")
            area = data.get("area") or None
            is_public = data.get("is_public", False)
            
            coords = data.get("center_coordinates", {})
            lat = coords.get("latitude") if isinstance(coords, dict) else data.get("latitude")
            lng = coords.get("longitude") if isinstance(coords, dict) else data.get("longitude")
            
            center_coordinates_json = json.dumps({"latitude": float(lat), "longitude": float(lng)})
            extent_meters = data.get("extent_meters", 500)
            
            # Retrieve the correct UUID from your custom Users table using the authenticated user's email
            user_uuid = None
            if request.user and request.user.is_authenticated:
                try:
                    # Assuming request.user.email or request.user.username matches the email in your users table
                    db_user = Users.objects.get(email=getattr(request.user, 'email', request.user.username))
                    user_uuid = str(db_user.user_id)
                except Users.DoesNotExist:
                    user_uuid = None

            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO construction_sites 
                    (site_name, start_date, location, city, country, area, is_public, center_coordinates, extent_meters, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s::uuid)
                    RETURNING construction_id;
                """, [
                    site_name, 
                    start_date, 
                    location, 
                    city, 
                    country, 
                    area, 
                    is_public, 
                    center_coordinates_json, 
                    extent_meters, 
                    user_uuid
                ])
                
                row = cursor.fetchone()
                site_id = row[0] if row else None

            return Response({"message": "Site registered successfully", "site_id": site_id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class DiscardPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        file_path = request.query_params.get("file_path")
        if not file_path:
            return Response({"detail": "file_path parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            supabase.storage.from_(BUCKET_NAME).remove([file_path])
            return Response({"message": "Temporary preview discarded."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)