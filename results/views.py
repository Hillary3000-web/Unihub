"""
results/views.py — Complete view set for UniHub backend.
Covers: Results, Study Materials, Announcements.
"""

import pandas as pd
from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Course, Result, StudyMaterial, Announcement
from .serializers import (
    CourseSerializer,
    ResultSerializer,
    ResultAdminSerializer,
    UploadResultSerializer,
    StudyMaterialSerializer,
    StudyMaterialUploadSerializer,
    AnnouncementSerializer,
    AnnouncementCreateSerializer,
)
from .permissions import IsAdvisor, IsStudent

User = get_user_model()

# ── FUTO Year 1 course registry ────────────────────────────────────────────────
FUTO_YEAR1_COURSES = {
    "MTH101":       ("Mathematics I",               2),
    "PHY101":       ("Physics I",                   2),
    "PHY107":       ("Physics Practical I",         1),
    "CHM101":       ("Chemistry I",                 2),
    "CHM107":       ("Chemistry Practical I",       1),
    "COS101":       ("Introduction to Computing",   3),
    "GST111":       ("Communication Skills",        2),
    "GST103":       ("Nigerian Peoples & Culture",  1),
    "STA111":       ("Statistics I",                3),
    "FUTO-IGB101":  ("Igbo Language",               1),
    "FUTO-FRN101":  ("French Language",             1),
}

VALID_GRADES   = {"A", "B", "C", "D", "E", "F"}
GRADE_TO_SCORE = {"A": 75, "B": 65, "C": 55, "D": 47, "E": 42, "F": 20}


# ══════════════════════════════════════════════════════════════════════════════
#  RESULTS
# ══════════════════════════════════════════════════════════════════════════════

def calculate_cgpa(results):
    total_weighted, total_units = 0, 0
    for r in results:
        gp = Result.GRADE_POINTS.get(r.grade, 0)
        total_weighted += gp * r.course.unit
        total_units += r.course.unit
    return round(total_weighted / total_units, 2) if total_units else 0.0


class CourseListView(generics.ListAPIView):
    """GET /api/courses/ — List all courses."""
    queryset           = Course.objects.all()
    serializer_class   = CourseSerializer
    permission_classes = [IsAuthenticated]


class MyResultsView(APIView):
    """GET /api/results/me/ — Student views their own grades + CGPA."""
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        results = Result.objects.filter(student=request.user).select_related("course")
        return Response({
            "student": request.user.get_full_name(),
            "matric":  request.user.identifier,
            "cgpa":    calculate_cgpa(results),
            "results": ResultSerializer(results, many=True).data,
        })


class AllResultsView(generics.ListAPIView):
    """GET /api/results/all/ — Advisor views all results. Filter by ?matric="""
    serializer_class   = ResultAdminSerializer
    permission_classes = [IsAuthenticated, IsAdvisor]

    def get_queryset(self):
        qs     = Result.objects.select_related("student", "course").all()
        matric = self.request.query_params.get("matric")
        if matric:
            qs = qs.filter(student__identifier__iexact=matric)
        return qs


class UploadResultsView(APIView):
    """POST /api/results/upload/ — Advisor bulk uploads FUTO Excel sheet."""
    permission_classes = [IsAuthenticated, IsAdvisor]
    COURSE_COLUMNS     = list(FUTO_YEAR1_COURSES.keys())

    def post(self, request):
        serializer = UploadResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data["file"]

        try:
            df = pd.read_excel(file, header=2, dtype=str)
        except Exception:
            return Response(
                {"error": "Could not read the file. Ensure it is a valid .xlsx file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        df.columns     = [str(c).strip().upper().replace(" ", "") for c in df.columns]
        df             = df.dropna(subset=["REG.NO."])
        created_count  = updated_count = skipped_count = 0
        errors         = []

        with transaction.atomic():
            for idx, row in df.iterrows():
                row_num = idx + 4
                matric  = str(row.get("REG.NO.", "")).strip()
                if not matric or matric == "nan":
                    continue

                try:
                    student = User.objects.get(identifier__iexact=matric, role="STUDENT")
                except User.DoesNotExist:
                    errors.append(f"Row {row_num}: REG. NO. '{matric}' not found — skipped.")
                    skipped_count += 1
                    continue

                for course_code in self.COURSE_COLUMNS:
                    col_key   = course_code.replace("-", "")
                    grade_raw = row.get(course_code) or row.get(col_key)

                    if not grade_raw or str(grade_raw).strip() in ("nan", "", "-"):
                        continue

                    grade = str(grade_raw).strip().upper()
                    if grade not in VALID_GRADES:
                        errors.append(f"Row {row_num} ({matric}) — {course_code}: invalid grade '{grade}'.")
                        continue

                    title, units = FUTO_YEAR1_COURSES[course_code]
                    course, _    = Course.objects.get_or_create(
                        code=course_code,
                        defaults={"title": title, "unit": units, "semester": "Harmattan", "session": "2023/2024"},
                    )

                    _, created = Result.objects.update_or_create(
                        student=student,
                        course=course,
                        defaults={"score": GRADE_TO_SCORE[grade], "grade": grade, "uploaded_by": request.user},
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

        return Response({
            "message":          "Upload complete.",
            "results_created":  created_count,
            "results_updated":  updated_count,
            "students_skipped": skipped_count,
            "errors":           errors,
        })


# ══════════════════════════════════════════════════════════════════════════════
#  STUDY MATERIALS (Resource Hub)
# ══════════════════════════════════════════════════════════════════════════════

class StudyMaterialListView(generics.ListAPIView):
    """
    GET /api/materials/
    Returns all study materials.
    Filter by course:        ?course=COS101
    Filter by type:          ?type=PAST_QUESTION
    """
    serializer_class   = StudyMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs          = StudyMaterial.objects.select_related("uploaded_by").all()
        course_code = self.request.query_params.get("course")
        mat_type    = self.request.query_params.get("type")

        if course_code:
            qs = qs.filter(course_code__iexact=course_code)
        if mat_type:
            qs = qs.filter(material_type__iexact=mat_type)
        return qs

    def get_serializer_context(self):
        return {"request": self.request}


class StudyMaterialUploadView(generics.CreateAPIView):
    """
    POST /api/materials/upload/
    Both Students and Advisors can upload materials.
    Accepts multipart/form-data with fields: title, course_code, material_type, file
    """
    serializer_class   = StudyMaterialUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Material uploaded successfully!", "title": serializer.data.get("title")},
            status=status.HTTP_201_CREATED,
        )


class StudyMaterialDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/materials/<id>/delete/
    Only the uploader or an Advisor can delete a material.
    """
    queryset           = StudyMaterial.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        # Allow delete if user is the uploader OR an advisor
        if obj.uploaded_by != self.request.user and not self.request.user.is_advisor:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete materials you uploaded.")
        return obj

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.file.delete(save=False)  # delete the actual file from disk
        obj.delete()
        return Response({"message": "Material deleted."}, status=status.HTTP_200_OK)


# ══════════════════════════════════════════════════════════════════════════════
#  ANNOUNCEMENTS
# ══════════════════════════════════════════════════════════════════════════════

class AnnouncementListView(generics.ListAPIView):
    """
    GET /api/announcements/
    All authenticated users can read announcements.
    Filter by priority: ?priority=URGENT  or  ?priority=IMPORTANT
    """
    serializer_class   = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs       = Announcement.objects.select_related("posted_by").all()
        priority = self.request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority__iexact=priority)
        return qs


class AnnouncementCreateView(generics.CreateAPIView):
    """
    POST /api/announcements/create/
    Advisor only — create a new announcement.
    """
    serializer_class   = AnnouncementCreateSerializer
    permission_classes = [IsAuthenticated, IsAdvisor]

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Announcement posted.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/announcements/<id>/   — Anyone can read
    PUT    /api/announcements/<id>/   — Advisor only (edit)
    DELETE /api/announcements/<id>/   — Advisor only (delete)
    """
    queryset         = Announcement.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AnnouncementCreateSerializer
        return AnnouncementSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdvisor()]
        return [IsAuthenticated()]