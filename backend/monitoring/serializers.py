
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
import uuid

from .models import (
    ConstructionSites,
    SiteAccessRequest,
    UserSite,
    ProgressLogs,
    Users
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

class RegisterSerializer(serializers.Serializer):

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        if Users.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):

        first_name = validated_data["first_name"].strip()
        last_name = validated_data["last_name"].strip()
        email = validated_data["email"]
        password = validated_data["password"]

        # Combine names for the application profile
        full_name = f"{first_name} {last_name}".strip()

        # 1. Create Django authentication account
        django_user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # 2. Create corresponding application profile
        Users.objects.create(
            user_id=uuid.uuid4(),
            email=email,
            password_hash=django_user.password,
            full_name=full_name
        )

        return django_user