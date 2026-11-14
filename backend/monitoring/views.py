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
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser

import json
import uuid

from django.db.models import Q
from django.shortcuts import get_object_or_404

from pathlib import Path
from django.conf import settings

import io
import tempfile
import math

from decimal import Decimal
from django.utils import timezone

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
    ChangeDetectionTestSerializer,
    ProgressAnalysisRequestSerializer,
)

from monitoring.image_retrieval.image_retrieval import get_image, upload_temporary_preview, supabase, BUCKET_NAME
CHANGE_DETECTION_THRESHOLD = 0.04

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

    # --- ADD THIS NEW METHOD TO SPLIT THE SITES ---
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        profile = get_profile_user(request)
        
        my_sites = []
        shared_sites = []
        
        for site in queryset:
            # Check if the site was created by the currently authenticated user
            if site.created_by == profile:
                my_sites.append(site)
            else:
                shared_sites.append(site)
                
        return Response({
            "my_sites": self.get_serializer(my_sites, many=True).data,
            "shared_sites": self.get_serializer(shared_sites, many=True).data
        })

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

            # Retrieve the authenticated user's profile
            profile = get_profile_user(request)

            if not profile:
                return Response(
                    {"detail": "User profile not found."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Retrieve the correct UUID from your custom Users table using the authenticated user's email
            # Create site and membership together
            with connection.cursor() as cursor:

                with transaction.atomic():

                    cursor.execute("""
                        INSERT INTO construction_sites
                        (
                            construction_id,
                            site_name,
                            start_date,
                            location,
                            city,
                            country,
                            area,
                            is_public,
                            center_coordinates,
                            extent_meters,
                            created_by
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s::jsonb, %s, %s
                        )
                        RETURNING construction_id;
                    """, [
                        uuid.uuid4(),
                        site_name,
                        start_date,
                        location,
                        city,
                        country,
                        area,
                        is_public,
                        center_coordinates_json,
                        extent_meters,
                        profile.user_id
                    ])

                    row = cursor.fetchone()
                    site_id = row[0]

                    # Automatically register creator as a site member
                    cursor.execute("""
                        INSERT INTO user_site
                        (
                            user_site_id,
                            user_id,
                            construction_id
                        )
                        VALUES (%s, %s, %s);
                    """, [
                        uuid.uuid4(),
                        profile.user_id,
                        site_id
                    ])

            return Response({
                "message": "Site registered successfully",
                "site_id": str(site_id),
                "owner_id": str(profile.user_id),
                "membership_created": True
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()

            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_site_metadata(request, site_id):
    profile = get_profile_user(request)
    if not profile:
        return Response({"detail": "User profile not found."}, status=status.HTTP_403_FORBIDDEN)

    # Validate that the site exists AND the current user created it
    site = get_object_or_404(ConstructionSites, construction_id=site_id)
    
    if site.created_by_id != profile.user_id:
        return Response(
            {"detail": "You do not have permission to edit this site. Only the creator can modify these details."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Extract allowed fields from request
    area = request.data.get("area")
    is_completed = request.data.get("is_completed")
    is_public = request.data.get("is_public")

    # Build the dynamic SQL update query
    update_fields = []
    params = []

    if area is not None:
        update_fields.append("area = %s")
        params.append(area if area != "" else None)
        
    if is_completed is not None:
        update_fields.append("is_completed = %s")
        params.append(bool(is_completed))
        
    if is_public is not None:
        update_fields.append("is_public = %s")
        params.append(bool(is_public))

    if not update_fields:
        return Response({"detail": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)

    query = f"""
        UPDATE construction_sites
        SET {', '.join(update_fields)}
        WHERE construction_id = %s;
    """
    params.append(site_id)

    try:
        with connection.cursor() as cursor:
            with transaction.atomic():
                cursor.execute(query, params)
                
        return Response({"message": "Site updated successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class TestChangeDetectionView(generics.GenericAPIView):

    serializer_class = ChangeDetectionTestSerializer

    permission_classes = [AllowAny]

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_a = serializer.validated_data["image_a"]
        image_b = serializer.validated_data["image_b"]
        threshold = serializer.validated_data["threshold"]

        try:
            # Validate file extensions
            allowed_extensions = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}

            ext_a = Path(image_a.name).suffix.lower()
            ext_b = Path(image_b.name).suffix.lower()

            if ext_a not in allowed_extensions or ext_b not in allowed_extensions:
                return Response(
                    {"detail": "Only JPG, JPEG, PNG, and TIFF images are supported."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a unique directory for this test
            test_id = str(uuid.uuid4())

            media_root = Path(settings.MEDIA_ROOT)

            test_dir = (
                media_root
                / "change_detection_tests"
                / test_id
            )

            test_dir.mkdir(parents=True, exist_ok=True)

            # Save uploaded images
            image_a_path = test_dir / f"image_a{ext_a}"
            image_b_path = test_dir / f"image_b{ext_b}"

            with open(image_a_path, "wb") as destination:
                for chunk in image_a.chunks():
                    destination.write(chunk)

            with open(image_b_path, "wb") as destination:
                for chunk in image_b.chunks():
                    destination.write(chunk)

            # Run BIT change detection model
            from .change_detection.inference import run_change_detection

            output_dir = test_dir / "results"

            results = run_change_detection(
                image_a=image_a_path,
                image_b=image_b_path,
                output_dir=output_dir,
                threshold=threshold
            )

            # Generate URLs for output images
            mask_relative = Path(results["mask_path"]).relative_to(media_root)

            overlay_relative = Path(results["overlay_path"]).relative_to(media_root)

            mask_url = request.build_absolute_uri(
                settings.MEDIA_URL + mask_relative.as_posix()
            )

            overlay_url = request.build_absolute_uri(
                settings.MEDIA_URL + overlay_relative.as_posix()
            )

            # Return results
            return Response(
                {
                    "status": "success",
                    "message": "Change detection completed successfully.",
                    "test_id": test_id,
                    "results": {
                        "mask_url": mask_url,
                        "overlay_url": overlay_url,
                        "changed_pixels": results["changed_pixels"],
                        "total_pixels": results["total_pixels"],
                        "change_percentage": results["change_percentage"],
                        "threshold": threshold
                    }
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            import traceback
            traceback.print_exc()

            return Response(
                {
                    "status": "error",
                    "detail": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SiteProgressAnalysisView(generics.GenericAPIView):

    serializer_class = ProgressAnalysisRequestSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, site_id):

        profile = get_profile_user(request)

        if not profile:
            return Response(
                {"detail": "User profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check site ownership or membership
        site = get_object_or_404(
            ConstructionSites.objects.filter(
                Q(created_by=profile) |
                Q(usersite__user=profile)
            ).distinct(),
            construction_id=site_id
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        analysis_mode = data["analysis_mode"]
        threshold = CHANGE_DETECTION_THRESHOLD
        later_target_date = data["later_date"]

        # Determine the two dates
        if analysis_mode == "baseline":
            earlier_target_date = site.start_date
        else:
            earlier_target_date = data["earlier_date"]

        if earlier_target_date < site.start_date:
            return Response(
                {"detail": "The earlier date cannot be before the construction start date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if earlier_target_date >= later_target_date:
            return Response(
                {"detail": "The later date must be after the earlier date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate site coordinates and extent
        try:
            coordinates = site.center_coordinates

            latitude = float(coordinates["latitude"])
            longitude = float(coordinates["longitude"])
            extent_meters = int(site.extent_meters)

            if not 1 <= extent_meters <= 1000:
                raise ValueError("Invalid site extent.")

        except (TypeError, KeyError, ValueError):
            return Response(
                {"detail": "The construction site has invalid coordinates or extent."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not supabase:
            return Response(
                {"detail": "Supabase is not initialized."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        progress_id = uuid.uuid4()

        progress_log = None

        # Unique storage folder for this analysis
        storage_folder = (
            f"{profile.user_id}-"
            f"{site.construction_id}-"
            f"{progress_id}"
        )

        try:

            # 1. Retrieve earlier satellite image
            earlier_image, earlier_info = get_image(
                target_date=earlier_target_date.isoformat(),
                lat=latitude,
                lon=longitude,
                extent_m=extent_meters
            )

            # 2. Retrieve later satellite image
            later_image, later_info = get_image(
                target_date=later_target_date.isoformat(),
                lat=latitude,
                lon=longitude,
                extent_m=extent_meters
            )

            # Use actual imagery release dates
            actual_earlier_date = date.fromisoformat(
                earlier_info["release_date"]
            )

            actual_later_date = date.fromisoformat(
                later_info["release_date"]
            )

            if actual_earlier_date >= actual_later_date:
                return Response(
                    {
                        "detail": (
                            "The satellite imagery provider returned "
                            "the same or an invalid pair of image dates. "
                            "Choose a different date range."
                        ),
                        "earlier_image_date": str(actual_earlier_date),
                        "later_image_date": str(actual_later_date)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Create progress record
            progress_log = ProgressLogs.objects.create(
                progress_id=progress_id,
                construction=site,
                requested_by=profile,
                earlier_date=actual_earlier_date,
                later_date=actual_later_date,
                satellite_image_date=actual_later_date,
                status="processing"
            )

            # 4. Run BIT inference
            with tempfile.TemporaryDirectory() as temp_dir:

                temp_path = Path(temp_dir)

                baseline_path = temp_path / "baseline.jpg"
                latest_path = temp_path / "latest.jpg"

                earlier_image.convert("RGB").save(
                    baseline_path,
                    format="JPEG",
                    quality=95
                )

                later_image.convert("RGB").save(
                    latest_path,
                    format="JPEG",
                    quality=95
                )

                output_dir = temp_path / "results"

                from .change_detection.inference import run_change_detection

                results = run_change_detection(
                    image_a=baseline_path,
                    image_b=latest_path,
                    output_dir=output_dir,
                    threshold=threshold
                )

                mask_path = Path(results["mask_path"])
                overlay_path = Path(results["overlay_path"])

                # 5. Convert images to bytes
                def image_to_bytes(image, image_format):

                    buffer = io.BytesIO()

                    image.save(
                        buffer,
                        format=image_format
                    )

                    return buffer.getvalue()

                baseline_bytes = image_to_bytes(
                    earlier_image.convert("RGB"),
                    "JPEG"
                )

                latest_bytes = image_to_bytes(
                    later_image.convert("RGB"),
                    "JPEG"
                )

                mask_bytes = mask_path.read_bytes()
                overlay_bytes = overlay_path.read_bytes()

                # 6. Upload all four images to Supabase
                def upload_file(file_path, file_bytes, content_type):

                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=file_path,
                        file=file_bytes,
                        file_options={
                            "content-type": content_type,
                            "cache-control": "3600",
                            "upsert": "false"
                        }
                    )

                    return file_path

                baseline_filename = upload_file(
                    f"{storage_folder}/baseline.jpg",
                    baseline_bytes,
                    "image/jpeg"
                )

                latest_filename = upload_file(
                    f"{storage_folder}/latest.jpg",
                    latest_bytes,
                    "image/jpeg"
                )

                mask_filename = upload_file(
                    f"{storage_folder}/change_mask.png",
                    mask_bytes,
                    "image/png"
                )

                overlay_filename = upload_file(
                    f"{storage_folder}/change_overlay.png",
                    overlay_bytes,
                    "image/png"
                )

                # 7. Calculate changed area safely

                raw_percentage = float(results["change_percentage"])

                if not math.isfinite(raw_percentage) or not 0 <= raw_percentage <= 100:
                    raise ValueError(
                        f"Invalid change percentage returned by BIT model: {raw_percentage}"
                    )

                change_percentage = Decimal(str(raw_percentage)).quantize(
                    Decimal("0.00001")
                )

                total_site_area = Decimal(extent_meters) ** 2

                area_changed = (
                    total_site_area * change_percentage / Decimal("100")
                ).quantize(Decimal("0.00001"))

                # 8. Update progress record
                progress_log.baseline_image_filename = baseline_filename
                progress_log.latest_image_filename = latest_filename
                progress_log.change_mask_filename = mask_filename
                progress_log.overlay_image_filename = overlay_filename

                progress_log.area_changed_sqm = area_changed
                progress_log.change_percentage = change_percentage

                progress_log.status = "completed"
                progress_log.processed_at = timezone.now()

                progress_log.save()

            # 9. Generate signed URLs for frontend
            def get_signed_url(file_path):

                response = (
                    supabase.storage
                    .from_(BUCKET_NAME)
                    .create_signed_url(
                        path=file_path,
                        expires_in=3600
                    )
                )

                return (
                    response.get("signedURL")
                    or response.get("signedUrl")
                )

            # 10. Return results
            return Response(
                {
                    "status": "success",
                    "message": "Construction site analysis completed.",

                    "progress": ProgressLogSerializer(
                        progress_log
                    ).data,

                    "analysis": {
                        "analysis_mode": analysis_mode,
                        "threshold": threshold,

                        "requested_dates": {
                            "earlier_date": str(earlier_target_date),
                            "later_date": str(later_target_date)
                        },

                        "actual_image_dates": {
                            "earlier_date": str(actual_earlier_date),
                            "later_date": str(actual_later_date)
                        },

                        "area_changed_sqm": round(area_changed, 5),
                        "change_percentage": round(change_percentage, 5),

                        "changed_pixels": results["changed_pixels"],
                        "total_pixels": results["total_pixels"],

                        "site_area_sqm": total_site_area
                    },

                    "images": {
                        "baseline": get_signed_url(baseline_filename),
                        "latest": get_signed_url(latest_filename),
                        "mask": get_signed_url(mask_filename),
                        "overlay": get_signed_url(overlay_filename)
                    },

                    "satellite_metadata": {
                        "earlier": earlier_info,
                        "later": later_info
                    }
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:

            import traceback
            traceback.print_exc()

            if progress_log:
                progress_log.status = "failed"
                progress_log.processed_at = timezone.now()

                progress_log.save(
                    update_fields=["status", "processed_at"]
                )

            return Response(
                {
                    "status": "error",
                    "detail": str(e),
                    "progress_id": str(progress_id)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
