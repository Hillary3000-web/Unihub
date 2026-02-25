from django.contrib import admin
from .models import Course, Result, StudyMaterial, Announcement


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display  = ["code", "title", "unit", "semester", "session"]
    search_fields = ["code", "title"]
    list_filter   = ["semester", "session"]


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display  = ["student", "course", "score", "grade", "uploaded_by", "uploaded_at"]
    search_fields = ["student__identifier", "student__first_name", "course__code"]
    list_filter   = ["grade", "course__semester"]
    readonly_fields = ["uploaded_at"]


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display  = ["title", "course_code", "material_type", "uploaded_by", "created_at"]
    search_fields = ["title", "course_code"]
    list_filter   = ["material_type"]


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display  = ["title", "priority", "posted_by", "created_at"]
    list_filter   = ["priority"]
    search_fields = ["title"]