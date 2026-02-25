from django.apps import AppConfig


class ResultsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"  # ✅ Fixes W042 warning
    name = "results"