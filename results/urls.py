"""
results/urls.py — Mounted at /api/ in backend/urls.py
"""

from django.urls import path
from .views import (
    # Results
    CourseListView,
    MyResultsView,
    AllResultsView,
    UploadResultsView,
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

    # ── Courses ────────────────────────────────────────────────────────────────
    path("courses/",                        CourseListView.as_view(),          name="course-list"),

    # ── Results ────────────────────────────────────────────────────────────────
    path("results/me/",                     MyResultsView.as_view(),           name="results-mine"),
    path("results/all/",                    AllResultsView.as_view(),          name="results-all"),
    path("results/upload/",                 UploadResultsView.as_view(),       name="results-upload"),

    # ── Study Materials ────────────────────────────────────────────────────────
    path("materials/",                      StudyMaterialListView.as_view(),   name="materials-list"),
    path("materials/upload/",               StudyMaterialUploadView.as_view(), name="materials-upload"),
    path("materials/<int:pk>/delete/",      StudyMaterialDeleteView.as_view(), name="materials-delete"),

    # ── Announcements ──────────────────────────────────────────────────────────
    path("announcements/",                  AnnouncementListView.as_view(),    name="announcements-list"),
    path("announcements/create/",           AnnouncementCreateView.as_view(),  name="announcements-create"),
    path("announcements/<int:pk>/",         AnnouncementDetailView.as_view(),  name="announcements-detail"),
]