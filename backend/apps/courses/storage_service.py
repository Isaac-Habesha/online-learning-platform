"""
Video storage service abstraction layer.

Provides a unified interface for video storage operations across different
storage providers (Supabase, AWS S3, etc.) while keeping business logic
storage-agnostic.
"""

import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class VideoStorageService:
    """
    Abstract video storage service that handles upload, deletion, and URL generation.
    Uses Django's storage backend abstraction for provider flexibility.
    """

    # Allowed video MIME types
    ALLOWED_MIME_TYPES = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',  # .avi
        'video/x-matroska',  # .mkv
    ]

    # Allowed file extensions
    ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv']

    # Maximum file size (default: 2GB, can be overridden via settings)
    DEFAULT_MAX_SIZE_MB = 2048

    @classmethod
    def get_max_upload_size(cls) -> int:
        """Get maximum upload size in bytes from settings or use default."""
        max_size_mb = getattr(settings, 'MAX_VIDEO_UPLOAD_SIZE_MB', cls.DEFAULT_MAX_SIZE_MB)
        return max_size_mb * 1024 * 1024  # Convert to bytes

    @classmethod
    def validate_video_file(cls, file: UploadedFile) -> Tuple[bool, Optional[str]]:
        """
        Validate uploaded video file.

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file size
        max_size = cls.get_max_upload_size()
        if file.size > max_size:
            max_mb = max_size / (1024 * 1024)
            return False, f"File size exceeds maximum allowed size of {max_mb:.0f}MB"

        # Check file extension
        filename = file.name.lower()
        if not any(filename.endswith(ext) for ext in cls.ALLOWED_EXTENSIONS):
            return False, f"File type not allowed. Allowed types: {', '.join(cls.ALLOWED_EXTENSIONS)}"

        # Check MIME type
        if file.content_type not in cls.ALLOWED_MIME_TYPES:
            return False, f"MIME type {file.content_type} not allowed. Allowed types: {', '.join(cls.ALLOWED_MIME_TYPES)}"

        return True, None

    @classmethod
    def generate_storage_key(cls, lesson_id: int, original_filename: str) -> str:
        """
        Generate a safe, unique storage key for a video.

        Format: videos/courses/{course_id}/lessons/{lesson_id}/{uuid}.{ext}
        """
        # Extract extension from original filename
        ext = original_filename.split('.')[-1].lower() if '.' in original_filename else 'mp4'
        unique_id = uuid.uuid4()

        # Note: course_id will be determined from lesson_id during upload
        return f"videos/lessons/{lesson_id}/{unique_id}.{ext}"

    @classmethod
    def upload_video(cls, file: UploadedFile, lesson_id: int, original_filename: str) -> Tuple[str, int]:
        """
        Upload video file to storage.

        Args:
            file: UploadedFile object
            lesson_id: ID of the lesson this video属于
            original_filename: Original filename from upload

        Returns:
            Tuple of (storage_key, file_size)

        Raises:
            ValueError: If validation fails
            IOError: If upload fails
        """
        # Validate file
        is_valid, error_msg = cls.validate_video_file(file)
        if not is_valid:
            raise ValueError(error_msg)

        # Generate storage key
        storage_key = cls.generate_storage_key(lesson_id, original_filename)

        try:
            # Upload using Django's storage backend
            # This works with both local storage and S3-compatible storage
            path = default_storage.save(storage_key, file)
            file_size = file.size

            logger.info(f"Successfully uploaded video to storage key: {storage_key}")
            return path, file_size

        except Exception as e:
            logger.error(f"Failed to upload video: {str(e)}")
            raise IOError(f"Video upload failed: {str(e)}")

    @classmethod
    def delete_video(cls, storage_key: str) -> bool:
        """
        Delete video file from storage.

        Args:
            storage_key: Storage key/path of the video to delete

        Returns:
            True if deletion successful, False otherwise
        """
        try:
            if default_storage.exists(storage_key):
                default_storage.delete(storage_key)
                logger.info(f"Successfully deleted video from storage: {storage_key}")
                return True
            else:
                logger.warning(f"Video not found in storage: {storage_key}")
                return False
        except Exception as e:
            logger.error(f"Failed to delete video: {str(e)}")
            return False

    @classmethod
    def get_video_url(cls, storage_key: str) -> str:
        """
        Get public URL for video file.

        Args:
            storage_key: Storage key/path of the video

        Returns:
            Public URL for the video
        """
        try:
            return default_storage.url(storage_key)
        except Exception as e:
            logger.error(f"Failed to generate video URL: {str(e)}")
            return ""

    @classmethod
    def video_exists(cls, storage_key: str) -> bool:
        """
        Check if video file exists in storage.

        Args:
            storage_key: Storage key/path of the video

        Returns:
            True if video exists, False otherwise
        """
        try:
            return default_storage.exists(storage_key)
        except Exception as e:
            logger.error(f"Failed to check video existence: {str(e)}")
            return False


class VideoProcessingService:
    """
    Service for video processing operations.
    For MVP, this provides basic metadata extraction.
    Can be extended with Celery tasks for transcoding, thumbnail generation, etc.
    """

    @classmethod
    def extract_video_metadata(cls, file_path: str) -> dict:
        """
        Extract metadata from video file (duration, dimensions, etc.).

        For MVP, returns placeholder values.
        In production, this would use ffmpeg or similar tools.

        Args:
            file_path: Path to video file

        Returns:
            Dictionary with video metadata
        """
        # MVP: Return placeholder values
        # In production, implement actual metadata extraction using ffmpeg-python or similar
        return {
            'duration_seconds': None,
            'width': None,
            'height': None,
        }

    @classmethod
    def generate_thumbnail(cls, video_path: str, output_path: str) -> str:
        """
        Generate thumbnail from video.

        For MVP, returns empty string.
        In production, this would use ffmpeg to extract a frame.

        Args:
            video_path: Path to video file
            output_path: Path for thumbnail output

        Returns:
            URL/path to generated thumbnail
        """
        # MVP: No thumbnail generation
        # In production, implement actual thumbnail generation
        return ""
