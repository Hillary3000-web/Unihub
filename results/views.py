"""
results/views.py — Complete view set for UniHub backend.
Covers: Results, Study Materials, Announcements, PDF Upload.
"""

import re
import pdfplumber
import pandas as pd

from django.contrib.auth import get_user_model
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
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
    StudentSummarySerializer,
)
from .permissions import IsAdvisor, IsStudent
from users.models import University, Department

User = get_user_model()


# ══════════════════════════════════════════════════════════════════════════════
#  UNIVERSITY / INSTITUTION VIEWS
# ══════════════════════════════════════════════════════════════════════════════

class UniversityListView(APIView):
    """GET /api/universities/ — Public. Returns all universities for registration dropdown."""
    permission_classes = [AllowAny]

    def get(self, request):
        unis = University.objects.all()
        data = [
            {
                "id": u.id,
                "name": u.name,
                "short_name": u.short_name,
                "departments": [
                    {"id": d.id, "name": d.name}
                    for d in u.departments.all()
                ],
            }
            for u in unis.prefetch_related("departments")
        ]
        return Response(data)

# ── FUTO Year 1 course registry (ordered — matches PDF column order) ──────────
COURSE_ORDER = [
    ("MTH101",      "Mathematics I",               2),
    ("PHY101",      "Physics I",                   2),
    ("PHY107",      "Physics Practical I",         1),
    ("CHM101",      "Chemistry I",                 2),
    ("CHM107",      "Chemistry Practical I",       1),
    ("COS101",      "Introduction to Computing",   3),
    ("GST111",      "Communication Skills",        2),
    ("GST103",      "Nigerian Peoples & Culture",  1),
    ("STA111",      "Statistics I",                3),
    ("FUTO-IGB101", "Igbo Language",               1),
    ("FUTO-FRN101", "French Language",             1),
]

FUTO_YEAR1_COURSES = {code: (title, units) for code, title, units in COURSE_ORDER}
VALID_GRADES       = {"A", "B", "C", "D", "E", "F"}
GRADE_TO_SCORE     = {"A": 75, "B": 65, "C": 55, "D": 47, "E": 42, "F": 20}

# Matches 11-digit FUTO reg number e.g. 20231386102
REG_PATTERN = re.compile(r'\b(20\d{9})\b')


# ══════════════════════════════════════════════════════════════════════════════
#  PDF PARSER
# ══════════════════════════════════════════════════════════════════════════════

def parse_pdf_results(file):
    """
    Parse a FUTO results PDF and return a list of dicts:
    [{ 'reg_no': str, 'name': str, 'grades': [11 grade letters] }, ...]
    """
    students = []

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            for line in text.split('\n'):
                reg_match = REG_PATTERN.search(line)
                if not reg_match:
                    continue

                reg_no = reg_match.group(1)
                tokens = line.split()

                # Find reg number position in tokens
                reg_idx = next((i for i, t in enumerate(tokens) if t == reg_no), None)
                if reg_idx is None:
                    continue

                after_reg = tokens[reg_idx + 1:]

                # Collect single A-F grade letters
                grade_tokens = [t for t in after_reg if t in VALID_GRADES]
                if len(grade_tokens) < 9:
                    continue  # not enough grades, skip row

                grades = grade_tokens[:11]
                while len(grades) < 11:
                    grades.append(None)

                # Extract name: tokens before first grade token
                first_grade_idx = next(
                    (i for i, t in enumerate(after_reg) if t in VALID_GRADES), None
                )
                if first_grade_idx is None:
                    name = "Unknown"
                else:
                    name_tokens = after_reg[:first_grade_idx]
                    # Remove serial numbers and 2-letter PDF artifacts (AN, CH, etc.)
                    name_tokens = [
                        t for t in name_tokens
                        if not t.isdigit()
                        and not (len(t) == 2 and t.isupper() and t.isalpha())
                    ]
                    name = ' '.join(name_tokens).strip(' ,.')

                students.append({'reg_no': reg_no, 'name': name, 'grades': grades})

    # Deduplicate by reg_no
    seen, unique = set(), []
    for s in students:
        if s['reg_no'] not in seen:
            seen.add(s['reg_no'])
            unique.append(s)

    return unique


def parse_name(full_name):
    """Split 'SURNAME, F. N.' into (first_name, last_name)."""
    if ',' in full_name:
        parts      = full_name.split(',', 1)
        last_name  = parts[0].strip().title()
        first_name = parts[1].strip().title()
    else:
        parts      = full_name.split(' ', 1)
        last_name  = parts[0].strip().title()
        first_name = parts[1].strip().title() if len(parts) > 1 else 'Student'
    return first_name, last_name


# ══════════════════════════════════════════════════════════════════════════════
#  RESULTS VIEWS
# ══════════════════════════════════════════════════════════════════════════════

def calculate_cgpa(results):
    total_weighted, total_units = 0, 0
    for r in results:
        gp              = Result.GRADE_POINTS.get(r.grade, 0)
        total_weighted += gp * r.course.unit
        total_units    += r.course.unit
    return round(total_weighted / total_units, 2) if total_units else 0.0


class CourseListView(generics.ListAPIView):
    """GET /api/courses/ — List courses for user's university."""
    serializer_class   = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        uni = self.request.user.university
        if uni:
            return Course.objects.filter(university=uni)
        return Course.objects.none()


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
    """GET /api/results/all/ — Advisor views results for students they created."""
    serializer_class   = ResultAdminSerializer
    permission_classes = [IsAuthenticated, IsAdvisor]

    def get_queryset(self):
        qs = Result.objects.select_related("student", "course").filter(
            student__created_by=self.request.user
        )
        matric = self.request.query_params.get("matric")
        if matric:
            qs = qs.filter(student__identifier__iexact=matric)
        return qs


# ══════════════════════════════════════════════════════════════════════════════
#  STUDENT VIEWS (Advisor)
# ══════════════════════════════════════════════════════════════════════════════

class StudentListView(APIView):
    """GET /api/students/ — Advisor views only students they created."""
    permission_classes = [IsAuthenticated, IsAdvisor]

    def get(self, request):
        students = User.objects.filter(role="STUDENT", created_by=request.user)
        students = students.prefetch_related("results__course")
        search = request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            students = students.filter(
                Q(identifier__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        data = StudentSummarySerializer(students, many=True).data
        return Response({"count": len(data), "students": data})


class StudentDetailView(APIView):
    """GET /api/students/<identifier>/results/ — Advisor views one student's results."""
    permission_classes = [IsAuthenticated, IsAdvisor]

    def get(self, request, identifier):
        try:
            student = User.objects.get(
                identifier__iexact=identifier,
                role="STUDENT",
                created_by=request.user,
            )
        except User.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        results = Result.objects.filter(student=student).select_related("course")
        return Response({
            "student": {
                "identifier": student.identifier,
                "name":       student.get_full_name(),
                "email":      student.email,
            },
            "cgpa":    calculate_cgpa(results),
            "results": ResultSerializer(results, many=True).data,
        })


@method_decorator(csrf_exempt, name='dispatch')
class UploadPDFResultsView(APIView):
    """
    POST /api/results/upload-pdf/
    No auth required during testing phase.
    Parses FUTO results PDF → creates student accounts → saves grades.
    """
    permission_classes     = [IsAuthenticated, IsAdvisor]
    parser_classes         = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {"error": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not file.name.lower().endswith('.pdf'):
            return Response(
                {"error": "Please upload a PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            parsed_students = parse_pdf_results(file)
        except Exception as e:
            return Response(
                {"error": f"Failed to read PDF: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not parsed_students:
            return Response(
                {"error": "No student data found in PDF. Check the file format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from users.models import StudentProfile

        students_created = results_created = results_updated = students_skipped = 0
        created_list = []
        errors       = []

        with transaction.atomic():
            # Ensure all courses exist in DB
            course_objs = {}
            advisor_uni = request.user.university
            for code, title, units in COURSE_ORDER:
                course, _ = Course.objects.get_or_create(
                    code=code,
                    university=advisor_uni,
                    defaults={
                        "title":    title,
                        "unit":     units,
                        "semester": "Harmattan",
                        "session":  "2023/2024",
                    },
                )
                course_objs[code] = course

            for s in parsed_students:
                reg_no = s['reg_no']
                name   = s['name']
                grades = s['grades']

                # Get or create student account
                try:
                    student = User.objects.get(identifier__iexact=reg_no, role="STUDENT")
                except User.DoesNotExist:
                    first_name, last_name = parse_name(name)
                    email = f"{reg_no.lower()}@student.unihub.local"

                    if User.objects.filter(email=email).exists():
                        errors.append(f"Duplicate: {reg_no} — skipped.")
                        students_skipped += 1
                        continue

                    try:
                        student = User.objects.create_user(
                            email      = email,
                            password   = reg_no,
                            first_name = first_name,
                            last_name  = last_name,
                            identifier = reg_no,
                            role       = "STUDENT",
                            university = advisor_uni,
                            created_by = request.user,
                        )
                        StudentProfile.objects.create(
                            user       = student,
                            department = "Computer Science",
                            level      = 100,
                        )
                        students_created += 1
                        created_list.append({
                            "identifier": reg_no,
                            "name":       student.get_full_name(),
                            "department": "Computer Science",
                        })
                    except Exception as e:
                        errors.append(f"{reg_no}: failed — {str(e)}")
                        students_skipped += 1
                        continue

                # Save grades
                for i, (code, _, _) in enumerate(COURSE_ORDER):
                    grade = grades[i] if i < len(grades) else None
                    if not grade or grade not in VALID_GRADES:
                        continue
                    _, created = Result.objects.update_or_create(
                        student = student,
                        course  = course_objs[code],
                        defaults={
                            "score": GRADE_TO_SCORE[grade],
                            "grade": grade,
                            "uploaded_by": request.user,
                        },
                    )
                    if created:
                        results_created += 1
                    else:
                        results_updated += 1

        return Response({
            "message":          "PDF processed successfully.",
            "students_created": students_created,
            "results_created":  results_created,
            "results_updated":  results_updated,
            "students_skipped": students_skipped,
            "students":         created_list,
            "errors":           errors,
        })


@method_decorator(csrf_exempt, name='dispatch')
class UploadResultsView(APIView):
    """POST /api/results/upload/ — Advisor bulk uploads FUTO Excel sheet."""
    permission_classes     = [IsAuthenticated, IsAdvisor]
    parser_classes         = [MultiPartParser, FormParser]
    COURSE_COLUMNS         = [code for code, _, _ in COURSE_ORDER]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
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

        df.columns       = [str(c).strip().upper().replace(" ", "") for c in df.columns]
        df               = df.dropna(subset=["REG.NO."])
        students_created = created_count = updated_count = skipped_count = 0
        created_list     = []
        errors           = []

        with transaction.atomic():
            for idx, row in df.iterrows():
                row_num = idx + 4
                matric  = str(row.get("REG.NO.", "")).strip()
                if not matric or matric == "nan":
                    continue

                try:
                    student = User.objects.get(identifier__iexact=matric, role="STUDENT")
                except User.DoesNotExist:
                    from users.models import StudentProfile

                    safe_matric = matric.replace("/", "").replace(" ", "").lower()
                    email = f"{safe_matric}@student.unihub.local"

                    if User.objects.filter(email=email).exists():
                        errors.append(f"Row {row_num}: Duplicate entry for '{matric}' — skipped.")
                        skipped_count += 1
                        continue

                    first_name = str(row.get("FIRSTNAME") or row.get("FIRST NAME") or matric).strip()
                    last_name  = str(row.get("LASTNAME") or row.get("LAST NAME") or row.get("SURNAME") or "Student").strip()

                    student = User.objects.create_user(
                        email      = email,
                        password   = matric,
                        first_name = first_name,
                        last_name  = last_name,
                        identifier = matric,
                        role       = "STUDENT",
                        university = request.user.university,
                        created_by = request.user,
                    )
                    StudentProfile.objects.get_or_create(
                        user     = student,
                        defaults = {"department": "Unknown", "level": 100},
                    )
                    students_created += 1
                    created_list.append({
                        "identifier": matric,
                        "name":       student.get_full_name(),
                        "department": "Unknown",
                    })

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
                        university=request.user.university,
                        defaults={"title": title, "unit": units, "semester": "Harmattan", "session": "2023/2024"},
                    )

                    _, created = Result.objects.update_or_create(
                        student  = student,
                        course   = course,
                        defaults = {
                            "score": GRADE_TO_SCORE[grade],
                            "grade": grade,
                            "uploaded_by": request.user,
                        },
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

        return Response({
            "message":          "Upload complete.",
            "students_created": students_created,
            "results_created":  created_count,
            "results_updated":  updated_count,
            "students_skipped": skipped_count,
            "students":         created_list,
            "errors":           errors,
        })


# ══════════════════════════════════════════════════════════════════════════════
#  STUDY MATERIALS
# ══════════════════════════════════════════════════════════════════════════════

class StudyMaterialListView(generics.ListAPIView):
    serializer_class   = StudyMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Advisors see only their own materials; students see their university's
        if user.is_advisor:
            qs = StudyMaterial.objects.select_related("uploaded_by").filter(uploaded_by=user)
        elif user.university:
            qs = StudyMaterial.objects.select_related("uploaded_by").filter(university=user.university)
        else:
            return StudyMaterial.objects.none()
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
    serializer_class   = StudyMaterialUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user, university=self.request.user.university)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Material uploaded successfully!", "title": serializer.data.get("title")},
            status=status.HTTP_201_CREATED,
        )


class StudyMaterialDeleteView(generics.DestroyAPIView):
    queryset           = StudyMaterial.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if obj.uploaded_by != self.request.user and not self.request.user.is_advisor:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete materials you uploaded.")
        return obj

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.file.delete(save=False)
        obj.delete()
        return Response({"message": "Material deleted."}, status=status.HTTP_200_OK)


# ══════════════════════════════════════════════════════════════════════════════
#  ANNOUNCEMENTS
# ══════════════════════════════════════════════════════════════════════════════

class AnnouncementListView(generics.ListAPIView):
    serializer_class   = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Advisors see only their own announcements; students see their university's
        if user.is_advisor:
            qs = Announcement.objects.select_related("posted_by").filter(posted_by=user)
        elif user.university:
            qs = Announcement.objects.select_related("posted_by").filter(university=user.university)
        else:
            return Announcement.objects.none()
        priority = self.request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority__iexact=priority)
        return qs


class AnnouncementCreateView(generics.CreateAPIView):
    serializer_class   = AnnouncementCreateSerializer
    permission_classes = [IsAuthenticated, IsAdvisor]

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user, university=self.request.user.university)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Announcement posted.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):

    def get_queryset(self):
        user = self.request.user
        if user.is_advisor:
            return Announcement.objects.filter(posted_by=user)
        elif user.university:
            return Announcement.objects.filter(university=user.university)
        return Announcement.objects.none()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AnnouncementCreateSerializer
        return AnnouncementSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdvisor()]
        return [IsAuthenticated()]