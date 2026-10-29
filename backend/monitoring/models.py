# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class ConstructionSites(models.Model):
    construction_id = models.UUIDField(primary_key=True)
    site_name = models.CharField()
    created_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    location = models.CharField(blank=True, null=True)
    city = models.CharField(blank=True, null=True)
    country = models.CharField(blank=True, null=True)
    area = models.DecimalField(max_digits=10, decimal_places=5, blank=True, null=True)  # max_digits and decimal_places have been guessed, as this database handles decimal fields as float
    start_date = models.DateField()
    is_completed = models.BooleanField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    is_public = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    current_progress = models.DecimalField(max_digits=10, decimal_places=5, blank=True, null=True)  # max_digits and decimal_places have been guessed, as this database handles decimal fields as float
    center_coordinates = models.JSONField(blank=True, null=True)
    extent_meters = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'construction_sites'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class ProgressLogs(models.Model):
    progress_id = models.UUIDField(primary_key=True)
    construction = models.ForeignKey(ConstructionSites, models.DO_NOTHING, blank=True, null=True)
    baseline_image_filename = models.CharField(blank=True, null=True)
    latest_image_filename = models.CharField(blank=True, null=True)
    change_mask_filename = models.CharField(blank=True, null=True)
    area_changed_sqm = models.DecimalField(max_digits=10, decimal_places=5, blank=True, null=True)  # max_digits and decimal_places have been guessed, as this database handles decimal fields as float
    change_percentage = models.DecimalField(max_digits=10, decimal_places=5, blank=True, null=True)  # max_digits and decimal_places have been guessed, as this database handles decimal fields as float
    status = models.CharField()
    satellite_image_date = models.DateField()
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'progress_logs'


class SiteAccessRequest(models.Model):
    request_id = models.UUIDField(primary_key=True)
    request_from = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    request_to = models.ForeignKey('Users', models.DO_NOTHING, related_name='siteaccessrequest_request_to_set', blank=True, null=True)
    construction = models.ForeignKey(ConstructionSites, models.DO_NOTHING, blank=True, null=True)
    status = models.CharField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'site_access_request'


class UserSite(models.Model):
    user_site_id = models.UUIDField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    construction = models.ForeignKey(ConstructionSites, models.DO_NOTHING, blank=True, null=True)
    granted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_site'


class Users(models.Model):
    user_id = models.UUIDField(primary_key=True)
    email = models.CharField(unique=True)
    password_hash = models.CharField()
    full_name = models.CharField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
