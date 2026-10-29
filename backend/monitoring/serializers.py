
from rest_framework import serializers
from .models import (
    ConstructionSites,
    SiteAccessRequest,
    UserSite,
    ProgressLogs,
)


class ConstructionSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConstructionSites
        fields = [
            "construction_id", "site_name", "created_by",
            "location", "city", "country", "area",
            "start_date", "is_completed", "end_date",
            "is_public", "created_at", "current_progress",
            "center_coordinates", "extent_meters",
        ]
        read_only_fields = [
            "construction_id", "created_by", "created_at",
        ]

    def validate_extent_meters(self, value):
        if value is None or not 1 <= value <= 1000:
            raise serializers.ValidationError(
                "Extent must be between 1 and 1000 meters."
            )
        return value

    def validate_center_coordinates(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "Provide latitude and longitude."
            )
        try:
            lat = float(value["latitude"])
            lon = float(value["longitude"])
        except (KeyError, TypeError, ValueError):
            raise serializers.ValidationError(
                "Provide numeric latitude and longitude."
            )

        if not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise serializers.ValidationError(
                "Coordinates are outside valid ranges."
            )
        return {"latitude": lat, "longitude": lon}


class SiteAccessRequestSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(
        source="construction.site_name", read_only=True
    )
    site_id = serializers.UUIDField(
        source="construction.construction_id", read_only=True
    )
    requester_email = serializers.EmailField(
        source="request_from.email", read_only=True
    )

    class Meta:
        model = SiteAccessRequest
        fields = [
            "request_id", "site_id", "site_name",
            "requester_email", "request_from", "request_to",
            "construction", "status", "created_at",
        ]
        read_only_fields = fields


class UserSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSite
        fields = ["user_site_id", "user", "construction", "granted_at"]
        read_only_fields = fields


class ProgressLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressLogs
        fields = [
            "progress_id", "construction",
            "baseline_image_filename", "latest_image_filename",
            "change_mask_filename", "area_changed_sqm",
            "change_percentage", "status",
            "satellite_image_date", "processed_at",
        ]
        read_only_fields = fields
