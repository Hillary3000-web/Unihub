"""
users/serializers.py

Simplified auth:
- Advisors register with name + staff ID + university + department + password
- Advisors login with staff ID + password
- Students login with just their reg number (it is also their password)
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.db import transaction

from .models import CustomUser, StudentProfile, University, Department


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Allows login with EITHER email or reg number/staff ID (identifier).
    Students use their reg number as username.
    Advisors use their staff ID.
    """

    def validate(self, attrs):
        login_input = attrs.get("email", "").strip()

        # Try to find user by identifier (reg number / staff ID) first
        user_obj = CustomUser.objects.filter(identifier__iexact=login_input).first()
        if user_obj:
            # Swap in their real email so SimpleJWT can authenticate normally
            attrs["email"] = user_obj.email

        data = super().validate(attrs)
        data["role"]       = self.user.role
        data["full_name"]  = self.user.get_full_name()
        data["identifier"] = self.user.identifier
        data["email"]      = self.user.email
        # Include university info
        if self.user.university:
            data["university"] = {
                "id": self.user.university.id,
                "name": self.user.university.name,
                "short_name": self.user.university.short_name,
            }
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"]       = user.role
        token["full_name"]  = user.get_full_name()
        token["identifier"] = user.identifier
        return token


class StudentLoginSerializer(serializers.Serializer):
    """
    Students log in with their registration number only.
    The reg number is both the identifier and the password.
    """
    reg_number = serializers.CharField(max_length=50)


class StudentProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model  = StudentProfile
        fields = ["department", "department_name", "level"]

    def get_department_name(self, obj):
        if obj.dept:
            return obj.dept.name
        return obj.department


class RegisterSerializer(serializers.ModelSerializer):
    """
    Advisor-only registration.
    Fields: first_name, last_name, identifier (Staff ID), university, department, password, password2
    Role is hardcoded to ADVISOR — students are created automatically via PDF/Excel upload.
    """
    password     = serializers.CharField(write_only=True, required=True)
    password2    = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    university   = serializers.IntegerField(write_only=True, required=True, help_text="University ID")
    department   = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")

    class Meta:
        model  = CustomUser
        fields = ["first_name", "last_name", "identifier", "university", "department", "password", "password2"]

    def validate_university(self, value):
        try:
            return University.objects.get(pk=value)
        except University.DoesNotExist:
            raise serializers.ValidationError("University not found.")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password2")
        password   = validated_data.pop("password")
        university = validated_data.pop("university")
        dept_name  = validated_data.pop("department", "")

        # Auto-generate email from identifier
        staff_id = validated_data["identifier"].replace("/", "").replace(" ", "").lower()
        email = f"{staff_id}@advisor.unihub.local"

        user = CustomUser(
            email=email,
            role=CustomUser.Role.ADVISOR,
            university=university,
            **validated_data,
        )
        user.set_password(password)
        user.save()

        # Create department if provided and doesn't exist
        if dept_name:
            Department.objects.get_or_create(
                university=university,
                name=dept_name,
            )

        return user


class UserMeSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    university_info = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = [
            "id", "email", "first_name", "last_name",
            "identifier", "role", "date_joined", "student_profile",
            "university_info",
        ]

    def get_university_info(self, obj):
        if obj.university:
            return {
                "id": obj.university.id,
                "name": obj.university.name,
                "short_name": obj.university.short_name,
            }
        return None