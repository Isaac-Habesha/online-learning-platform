import uuid
from django.conf import settings
from django.db import models

from apps.courses.models import Course


class PaymentOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_orders",
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="payment_orders",
    )

    tx_ref = models.CharField(
        max_length=120,
        unique=True,
        db_index=True,
        help_text="Unique transaction reference passed to payment gateway",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    currency = models.CharField(
        max_length=10,
        default="ETB",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    chapa_reference = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Reference key returned by Chapa after verification",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tx_ref"]),
            models.Index(fields=["learner", "status"]),
            models.Index(fields=["course", "status"]),
        ]

    def __str__(self):
        return f"Order {self.tx_ref} - {self.course.title} ({self.amount} {self.currency}) [{self.status}]"
