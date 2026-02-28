from django.urls import path
from .views import (
    # Universities
    UniversityListView,
    # Results
    CourseListView,
    MyResultsView,
    AllResultsView,
    UploadResultsView,
    UploadPDFResultsView,
    # Students
    StudentListView,
    StudentDetailView,
    # Study Materials
    StudyMaterialListView,
    StudyMaterialUploadView,
    StudyMaterialDeleteView,
    # Announcements
    AnnouncementListView,
    AnnouncementCreateView,
    AnnouncementDetailView,
)

urlpatterns = [

    # ── Universities (public) ──────────────────────────────────────────────────
    path("universities/",                   UniversityListView.as_view(),      name="university-list"),


    # ── Courses ────────────────────────────────────────────────────────────────
    path("courses/",                        CourseListView.as_view(),          name="course-list"),

    # ── Results ────────────────────────────────────────────────────────────────
    path("results/me/",                     MyResultsView.as_view(),           name="results-mine"),
    path("results/all/",                    AllResultsView.as_view(),          name="results-all"),
    path("results/upload/",                 UploadResultsView.as_view(),       name="results-upload"),
    path("results/upload-pdf/",             UploadPDFResultsView.as_view(),    name="results-upload-pdf"),

    # ── Students (Advisor) ─────────────────────────────────────────────────────
    path("students/",                       StudentListView.as_view(),         name="students-list"),
    path("students/<str:identifier>/results/", StudentDetailView.as_view(),    name="students-detail"),

    # ── Study Materials ────────────────────────────────────────────────────────
    path("materials/",                      StudyMaterialListView.as_view(),   name="materials-list"),
    path("materials/upload/",               StudyMaterialUploadView.as_view(), name="materials-upload"),
    path("materials/<int:pk>/delete/",      StudyMaterialDeleteView.as_view(), name="materials-delete"),

    # ── Announcements ──────────────────────────────────────────────────────────
    path("announcements/",                  AnnouncementListView.as_view(),    name="announcements-list"),
    path("announcements/create/",           AnnouncementCreateView.as_view(),  name="announcements-create"),
    path("announcements/<int:pk>/",         AnnouncementDetailView.as_view(),  name="announcements-detail"),
]