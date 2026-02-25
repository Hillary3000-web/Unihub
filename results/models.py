from django.db import models
from django.conf import settings


# ─── Course ────────────────────────────────────────────────────────────────────

class Course(models.Model):
    code        = models.CharField(max_length=20, unique=True, help_text="e.g. CSC301")
    title       = models.CharField(max_length=200)
    unit        = models.PositiveSmallIntegerField(help_text="Credit units, e.g. 3")
    semester    = models.CharField(max_length=20, default="First")
    session     = models.CharField(max_length=20, help_text="e.g. 2023/2024")

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.title} ({self.unit} units)"


# ─── Result ────────────────────────────────────────────────────────────────────

class Result(models.Model):
    class Grade(models.TextChoices):
        A  = "A",  "A  (70–100)"
        B  = "B",  "B  (60–69)"
        C  = "C",  "C  (50–59)"
        D  = "D",  "D  (45–49)"
        E  = "E",  "E  (40–44)"
        F  = "F",  "F  (0–39)"

    # Grade points used for CGPA calculation
    GRADE_POINTS = {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}

    student  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="results",
        limit_choices_to={"role": "STUDENT"},
    )
    course   = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="results")
    score    = models.DecimalField(max_digits=5, decimal_places=2)
    grade    = models.CharField(max_length=2, choices=Grade.choices)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_results",
        limit_choices_to={"role": "ADVISOR"},
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A student can only have one result per course
        unique_together = ["student", "course"]
        ordering = ["course__code"]

    def __str__(self):
        return f"{self.student.identifier} | {self.course.code} → {self.grade}"

    @staticmethod
    def score_to_grade(score: float) -> str:
        """Convert a numeric score to a letter grade (Nigerian university scale)."""
        if score >= 70: return "A"
        if score >= 60: return "B"
        if score >= 50: return "C"
        if score >= 45: return "D"
        if score >= 40: return "E"
        return "F"


# ─── Study Material (Resource Hub) ────────────────────────────────────────────

class StudyMaterial(models.Model):
    class MaterialType(models.TextChoices):
        PAST_QUESTION = "PAST_QUESTION", "Past Question"
        LECTURE_NOTE  = "LECTURE_NOTE",  "Lecture Note"
        OTHER         = "OTHER",         "Other"

    title         = models.CharField(max_length=255)
    course_code   = models.CharField(max_length=20, help_text="e.g. CSC301")
    file          = models.FileField(upload_to="materials/")
    material_type = models.CharField(
        max_length=20,
        choices=MaterialType.choices,
        default=MaterialType.OTHER,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_materials",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.course_code} — {self.title}"


# ─── Announcement System ───────────────────────────────────────────────────────

class Announcement(models.Model):
    class Priority(models.TextChoices):
        NORMAL    = "NORMAL",    "Normal"
        IMPORTANT = "IMPORTANT", "Important"
        URGENT    = "URGENT",    "Urgent"

    title     = models.CharField(max_length=200)
    content   = models.TextField()
    priority  = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="announcements",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.priority}] {self.title}"