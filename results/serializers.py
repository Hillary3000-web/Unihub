"""
results/serializers.py
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Course, Result, StudyMaterial, Announcement

User = get_user_model()


# ── Course ─────────────────────────────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Course
        fields = ["id", "code", "title", "unit", "semester", "session"]


# ── Result ─────────────────────────────────────────────────────────────────────

class ResultSerializer(serializers.ModelSerializer):
    course      = CourseSerializer(read_only=True)
    grade_point = serializers.SerializerMethodField()

    class Meta:
        model  = Result
        fields = ["id", "course", "score", "grade", "grade_point", "uploaded_at"]

    def get_grade_point(self, obj):
        return Result.GRADE_POINTS.get(obj.grade, 0)


class ResultAdminSerializer(serializers.ModelSerializer):
    course        = CourseSerializer(read_only=True)
    student_name  = serializers.CharField(source="student.get_full_name", read_only=True)
    matric_number = serializers.CharField(source="student.identifier", read_only=True)
    grade_point   = serializers.SerializerMethodField()

    class Meta:
        model  = Result
        fields = [
            "id", "student_name", "matric_number",
            "course", "score", "grade", "grade_point", "uploaded_at",
        ]

    def get_grade_point(self, obj):
        return Result.GRADE_POINTS.get(obj.grade, 0)


class UploadResultSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.lower().endswith((".xlsx", ".xls")):
            raise serializers.ValidationError("Only Excel files (.xlsx or .xls) are accepted.")
        return value


# ── Study Material ─────────────────────────────────────────────────────────────

class StudyMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.get_full_name", read_only=True
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = StudyMaterial
        fields = [
            "id", "title", "course_code", "material_type",
            "file_url", "uploaded_by_name", "created_at",
        ]
        read_only_fields = ["uploaded_by_name", "file_url", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class StudyMaterialUploadSerializer(serializers.ModelSerializer):
    """Used for creating a new study material — includes the file field."""

    class Meta:
        model  = StudyMaterial
        fields = ["title", "course_code", "material_type", "file"]

    def validate_file(self, value):
        # 20MB limit
        max_size = 20 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must not exceed 20MB.")
        return value


# ── Announcement ───────────────────────────────────────────────────────────────

class AnnouncementSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(
        source="posted_by.get_full_name", read_only=True
    )

    class Meta:
        model  = Announcement
        fields = [
            "id", "title", "content", "priority",
            "posted_by_name", "created_at",
        ]
        read_only_fields = ["posted_by_name", "created_at"]


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """Used by Advisors to create/update announcements."""

    class Meta:
        model  = Announcement
        fields = ["id", "title", "content", "priority"]


# ── Student Summary (Advisor view) ────────────────────────────────────────────

class StudentSummarySerializer(serializers.Serializer):
    """Summarises a student with computed CGPA for the advisor's student list."""
    id           = serializers.IntegerField(source="pk")
    identifier   = serializers.CharField()
    first_name   = serializers.CharField()
    last_name    = serializers.CharField()
    email        = serializers.EmailField()
    result_count = serializers.SerializerMethodField()
    cgpa         = serializers.SerializerMethodField()

    def get_result_count(self, obj):
        return obj.results.count()

    def get_cgpa(self, obj):
        results = obj.results.select_related("course").all()
        total_weighted, total_units = 0, 0
        for r in results:
            gp = Result.GRADE_POINTS.get(r.grade, 0)
            total_weighted += gp * r.course.unit
            total_units += r.course.unit
        return round(total_weighted / total_units, 2) if total_units else 0.0