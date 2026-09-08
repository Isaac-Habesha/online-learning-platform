import uuid
from django.db import models
from apps.accounts.models import User
from apps.courses.models import Course


class Notification(models.Model):
    class Type(models.TextChoices):
        COURSE_ANNOUNCEMENT = "COURSE_ANNOUNCEMENT", "Course Announcement"
        INSTRUCTOR_MESSAGE = "INSTRUCTOR_MESSAGE", "Instructor Learning Notice"
        SYSTEM = "SYSTEM", "System Notification"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(
        max_length=30, choices=Type.choices, default=Type.COURSE_ANNOUNCEMENT
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications"
    )
    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="sent_notifications"
    )
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="direct_notifications"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["course", "-created_at"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.type}] {self.title}"


class NotificationRead(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notification_reads"
    )
    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="reads"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "notification"],
                name="unique_user_notification_read",
            )
        ]

    def __str__(self):
        return f"User {self.user.email} read {self.notification.id}"
