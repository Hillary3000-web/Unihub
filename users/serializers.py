"""
users/serializers.py

Simplified auth:
- Advisors register with name + title + staff ID + password
- Advisors login with staff ID + password
- Students login with just their reg number (it is also their password)
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.db import transaction

from .models import CustomUser, StudentProfile


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
    class Meta:
        model  = StudentProfile
        fields = ["department", "level"]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Advisor-only registration.
    Fields: first_name, last_name, identifier (Staff ID), password, password2
    Role is hardcoded to ADVISOR — students are created automatically via PDF/Excel upload.
    """
    password  = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")

    class Meta:
        model  = CustomUser
        fields = ["first_name", "last_name", "identifier", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")

        # Auto-generate email from identifier
        staff_id = validated_data["identifier"].replace("/", "").replace(" ", "").lower()
        email = f"{staff_id}@advisor.unihub.local"

        user = CustomUser(
            email=email,
            role=CustomUser.Role.ADVISOR,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user


class UserMeSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model  = CustomUser
        fields = [
            "id", "email", "first_name", "last_name",
            "identifier", "role", "date_joined", "student_profile",
        ]