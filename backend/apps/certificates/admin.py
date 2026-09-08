from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = [
        "certificate_code",
        "learner_full_name",
        "course_title",
        "instructor_name",
        "issued_at",
    ]
    search_fields = [
        "certificate_code",
        "learner_full_name",
        "course_title",
        "instructor_name",
    ]
    list_filter = ["issued_at"]
    readonly_fields = [
        "id",
        "certificate_code",
        "learner_full_name",
        "course_title",
        "instructor_name",
        "issued_at",
    ]
