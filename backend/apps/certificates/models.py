import uuid
from django.conf import settings
from django.db import models

from apps.courses.models import Course
from apps.enrollments.models import Enrollment


class Certificate(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="certificate",
    )

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates",
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="certificates",
    )

    certificate_code = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique verifiable public certificate code",
    )

    # Immutable snapshots at time of issuance
    learner_full_name = models.CharField(
        max_length=255,
        help_text="Learner full name snapshot at time of completion",
    )

    course_title = models.CharField(
        max_length=255,
        help_text="Course title snapshot at time of completion",
    )

    instructor_name = models.CharField(
        max_length=255,
        help_text="Course instructor name snapshot at time of completion",
    )

    issued_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    pdf_file = models.FileField(
        upload_to="certificates/pdfs/",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-issued_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["learner", "course"],
                name="unique_learner_course_certificate",
            ),
        ]
        indexes = [
            models.Index(fields=["certificate_code"]),
            models.Index(fields=["learner", "course"]),
            models.Index(fields=["issued_at"]),
        ]

    def __str__(self):
        return f"Certificate {self.certificate_code} - {self.learner_full_name} - {self.course_title}"
