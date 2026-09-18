from django.conf import settings
from django.db import models
from django.utils.text import slugify
from apps.categories.models import Category
import uuid


class Course(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED = "ARCHIVED", "Archived"

    class Level(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
    )

    title = models.CharField(
        max_length=255,
    )

    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
    )

    short_description = models.CharField(
        max_length=500,
    )

    description = models.TextField()

    thumbnail = models.ImageField(
        upload_to="courses/thumbnails/",
        blank=True,
        null=True,
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="courses",
        db_index=True,
        null=True,
        blank=True,
    )

    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.BEGINNER,
    )

    language = models.CharField(
        max_length=50,
        default="English",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    is_free = models.BooleanField(
        default=True,
    )

    requirements = models.TextField(
        blank=True,
    )

    learning_objectives = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    published_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
            models.Index(fields=["level"]),
            models.Index(fields=["instructor"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Announcement(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="announcements",
    )
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_announcements",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    live_stream_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["course", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.course.title}: {self.title}"




class CourseSection(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="sections",
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    is_published = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["order", "created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["course", "order"],
                name="unique_section_order_per_course",
            ),
        ]

        indexes = [
            models.Index(
                fields=["course", "order"],
            ),
        ]

    def __str__(self):
        return f"{self.course.title} - {self.title}"



class Lesson(models.Model):

    class ContentType(models.TextChoices):
        VIDEO = "VIDEO", "Video"
        ARTICLE = "ARTICLE", "Article"
        DOCUMENT = "DOCUMENT", "Document"
        EXTERNAL = "EXTERNAL", "External Resource"

    class VideoType(models.TextChoices):
        NONE = "NONE", "No Video"
        EXTERNAL = "EXTERNAL", "External Video"
        HOSTED = "HOSTED", "Hosted Video"

    section = models.ForeignKey(
        CourseSection,
        on_delete=models.CASCADE,
        related_name="lessons",
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
    )

    content_type = models.CharField(
        max_length=20,
        choices=ContentType.choices,
        default=ContentType.VIDEO,
    )

    video_type = models.CharField(
        max_length=20,
        choices=VideoType.choices,
        default=VideoType.NONE,
    )

    video_url = models.URLField(
        blank=True,
        help_text="External video URL (for EXTERNAL video type)",
    )

    article_content = models.TextField(
        blank=True,
    )

    document = models.FileField(
        upload_to="courses/documents/",
        blank=True,
        null=True,
    )

    external_url = models.URLField(
        blank=True,
    )

    duration_minutes = models.PositiveIntegerField(
        default=0,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    is_free_preview = models.BooleanField(
        default=False,
    )

    is_published = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["order", "created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["section", "order"],
                name="unique_lesson_order_per_section",
            ),
        ]

        indexes = [
            models.Index(
                fields=["section", "order"],
            ),
            models.Index(
                fields=["content_type"],
            ),
            models.Index(
                fields=["video_type"],
            ),
            models.Index(
                fields=["is_published"],
            ),
        ]

    def __str__(self):
        return f"{self.section.title} - {self.title}"


class Video(models.Model):
    """
    Model for hosting platform-uploaded videos for lessons.
    Supports storage abstraction and processing lifecycle.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        UPLOADING = "UPLOADING", "Uploading"
        UPLOADED = "UPLOADED", "Uploaded"
        PROCESSING = "PROCESSING", "Processing"
        READY = "READY", "Ready"
        FAILED = "FAILED", "Failed"

    lesson = models.OneToOneField(
        Lesson,
        on_delete=models.CASCADE,
        related_name="hosted_video",
    )

    # Storage metadata
    storage_key = models.CharField(
        max_length=500,
        unique=True,
        help_text="Server-generated storage path/key",
    )

    storage_provider = models.CharField(
        max_length=50,
        default="supabase",
        help_text="Storage provider (supabase, aws_s3, etc.)",
    )

    # File metadata
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename from upload",
    )

    file_size = models.BigIntegerField(
        help_text="File size in bytes",
    )

    mime_type = models.CharField(
        max_length=100,
        help_text="MIME type of the video file",
    )

    # Video metadata (populated during processing)
    duration_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Video duration in seconds",
    )

    width = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Video width in pixels",
    )

    height = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Video height in pixels",
    )

    # Processing lifecycle
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # Playback URLs
    playback_url = models.URLField(
        blank=True,
        help_text="Secure playback URL (can be signed/temporary)",
    )

    thumbnail_url = models.URLField(
        blank=True,
        help_text="URL to video thumbnail",
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    uploaded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When upload completed",
    )

    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When processing completed",
    )

    # Error handling
    error_message = models.TextField(
        blank=True,
        help_text="Error details if processing failed",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["lesson"]),
            models.Index(fields=["storage_provider"]),
        ]

    def __str__(self):
        return f"Video for {self.lesson.title} ({self.status})"

    def generate_storage_key(self):
        """
        Generate a safe, unique storage key for the video.
        Format: videos/courses/{course_id}/lessons/{lesson_id}/{uuid}.{ext}
        """
        course_id = self.lesson.section.course.id
        lesson_id = self.lesson.id
        unique_id = uuid.uuid4()

        # Extract extension from original filename
        ext = self.original_filename.split('.')[-1].lower() if '.' in self.original_filename else 'mp4'

        return f"videos/courses/{course_id}/lessons/{lesson_id}/{unique_id}.{ext}"

    def save(self, *args, **kwargs):
        # Auto-generate storage key if not provided
        if not self.storage_key and self.original_filename:
            self.storage_key = self.generate_storage_key()
        super().save(*args, **kwargs)


class CourseCompletionPolicy(models.TextChoices):
    LESSONS_ONLY = "LESSONS_ONLY", "Lessons Only"
    LESSONS_AND_QUIZZES = "LESSONS_AND_QUIZZES", "Lessons and Passing Quizzes"
    ALL = (
        "ALL",
        "Lessons, Passing Quizzes, and Graded/Submitted Assignments",
    )


class CourseBookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_bookmarks",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="bookmarked_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course"],
                name="unique_user_course_bookmark",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} bookmarked {self.course.title}"