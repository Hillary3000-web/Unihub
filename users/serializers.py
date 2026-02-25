"""
users/serializers.py
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from .models import CustomUser, StudentProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT login — enriches token payload with role, name, identifier."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.get_full_name()
        token["identifier"] = user.identifier
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["full_name"] = self.user.get_full_name()
        data["identifier"] = self.user.identifier
        data["email"] = self.user.email
        return data


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ["department", "level"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")

    # Student-only fields
    department = serializers.CharField(required=False, allow_blank=True)
    level = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "email", "first_name", "last_name",
            "identifier", "role",
            "password", "password2",
            "department", "level",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        if attrs.get("role") == CustomUser.Role.STUDENT:
            if not attrs.get("department"):
                raise serializers.ValidationError(
                    {"department": "Department is required for students."}
                )
            if attrs.get("level") is None:
                raise serializers.ValidationError(
                    {"level": "Level is required for students."}
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password2")
        department = validated_data.pop("department", None)
        level = validated_data.pop("level", None)
        password = validated_data.pop("password")

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == CustomUser.Role.STUDENT:
            StudentProfile.objects.create(user=user, department=department, level=level)

        return user


class UserMeSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "first_name", "last_name",
            "identifier", "role", "date_joined", "student_profile",
        ]