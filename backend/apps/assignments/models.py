from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from apps.courses.models import Lesson, CourseSection

def assignment_file_path(instance, filename):
    return f"assignments/course_{instance.assignment.course.id}/user_{instance.user.id}/{filename}"

class Assignment(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True, related_name='assignments')
    section = models.ForeignKey(CourseSection, on_delete=models.CASCADE, null=True, blank=True, related_name='assignments')
    title = models.CharField(max_length=255)
    instructions = models.TextField()
    due_date = models.DateTimeField(null=True, blank=True)
    max_marks = models.PositiveIntegerField(default=100)
    allowed_extensions = models.CharField(max_length=255, default="pdf,zip,doc,docx", help_text="Comma-separated extensions")
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def course(self):
        if self.lesson:
            return self.lesson.section.course
        return self.section.course

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(lesson__isnull=False) | models.Q(section__isnull=False),
                name='assignment_must_belong_to_lesson_or_section'
            )
        ]

    def __str__(self):
        return self.title

class AssignmentSubmission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        GRADED = 'GRADED', 'Graded'
        RETURNED = 'RETURNED', 'Returned'

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assignment_submissions')
    text_submission = models.TextField(blank=True)
    file_submission = models.FileField(
        upload_to=assignment_file_path, 
        blank=True, 
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'zip', 'doc', 'docx', 'txt', 'png', 'jpg'])]
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    is_late = models.BooleanField(default=False)
    grade = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='graded_assignments'
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.email} - {self.assignment.title}"