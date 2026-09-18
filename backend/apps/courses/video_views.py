"""
Video upload and management views.

Handles video upload, processing, playback, and management operations
with proper authorization and validation.
"""

from django.utils import timezone
from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
import logging

from apps.accounts.models import User
from apps.enrollments.models import Enrollment

from .models import (
    Lesson,
    Video,
)
from .permissions import (
    IsLessonOwnerOrAdmin,
)
from .serializers import (
    VideoSerializer,
    VideoPublicSerializer,
)
from .storage_service import (
    VideoStorageService,
    VideoProcessingService,
)

logger = logging.getLogger(__name__)


class VideoUploadView(APIView):
    """
    Upload a video for a lesson.

    Only instructors who own the course containing the lesson may upload videos.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_lesson(self, lesson_id):
        """Get lesson with related objects."""
        return (
            Lesson.objects
            .select_related(
                "section",
                "section__course",
                "section__course__instructor",
            )
            .filter(id=lesson_id)
            .first()
        )

    def check_ownership(self, user, lesson):
        """
        Check if user owns the course containing the lesson.

        Authorization chain:
        - JWT authentication (handled by permission class)
        - Instructor role or Admin role
        - Lesson exists
        - Lesson belongs to section
        - Section belongs to course
        - Instructor owns course
        """
        if user.role == User.Role.ADMIN:
            return True

        if user.role == User.Role.INSTRUCTOR:
            course = lesson.section.course
            return course.instructor_id == user.id

        return False

    @extend_schema(
        operation_id="upload_video",
        description="Upload a video for a lesson (instructor owner only)",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'video': {
                        'type': 'string',
                        'format': 'binary'
                    }
                }
            }
        },
        responses={201: VideoSerializer, 400: None, 403: None, 404: None}
    )
    def post(self, request, lesson_id):
        try:
            lesson = self.get_lesson(lesson_id)

            if not lesson:
                return Response(
                    {"detail": "Lesson not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check ownership
            if not self.check_ownership(request.user, lesson):
                return Response(
                    {"detail": "You can only upload videos to your own lessons."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if lesson already has a hosted video
            if Video.objects.filter(lesson=lesson).exists():
                return Response(
                    {"detail": "Lesson already has a hosted video. Use replace endpoint to update."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get video file from request
            video_file = request.FILES.get('video')
            if not video_file:
                return Response(
                    {"detail": "No video file provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate video file
            is_valid, error_msg = VideoStorageService.validate_video_file(video_file)
            if not is_valid:
                return Response(
                    {"detail": error_msg},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create video record in PENDING state
            video = Video.objects.create(
                lesson=lesson,
                original_filename=video_file.name,
                file_size=video_file.size,
                mime_type=video_file.content_type,
                status=Video.Status.UPLOADING,
                storage_provider='supabase',  # Using configured storage
            )

            # Upload to storage
            try:
                storage_key, file_size = VideoStorageService.upload_video(
                    video_file,
                    lesson.id,
                    video_file.name
                )

                # Update video record with storage info
                video.storage_key = storage_key
                video.file_size = file_size
                video.status = Video.Status.UPLOADED
                video.uploaded_at = timezone.now()
                video.save()

                # Generate playback URL
                playback_url = VideoStorageService.get_video_url(storage_key)
                video.playback_url = playback_url
                video.save()

                # For MVP, mark as READY immediately
                # In production, this would trigger async processing
                video.status = Video.Status.READY
                video.processed_at = timezone.now()
                video.save()

                # Update lesson to use hosted video
                lesson.video_type = Lesson.VideoType.HOSTED
                lesson.save()

                logger.info(f"Video uploaded successfully for lesson {lesson.id}")

                serializer = VideoSerializer(video)
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                # Mark video as failed
                video.status = Video.Status.FAILED
                video.error_message = str(e)
                video.save()

                logger.error(f"Video upload failed for lesson {lesson.id}: {str(e)}")
                return Response(
                    {"detail": f"Video upload failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            logger.error(f"Unexpected error during video upload: {str(e)}")
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VideoDetailView(APIView):
    """
    Get, update, or delete a video for a lesson.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, video_id):
        """Get video with related lesson."""
        return (
            Video.objects
            .select_related(
                "lesson",
                "lesson__section",
                "lesson__section__course",
                "lesson__section__course__instructor",
            )
            .filter(id=video_id)
            .first()
        )

    @extend_schema(
        operation_id="get_video",
        description="Get video details (instructor owner only)",
        responses={200: VideoSerializer, 403: None, 404: None}
    )
    def get(self, request, video_id):
        try:
            video = self.get_object(video_id)

            if not video:
                return Response(
                    {"detail": "Video not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check ownership
            permission = IsLessonOwnerOrAdmin()
            if not permission.has_object_permission(request, self, video.lesson):
                return Response(
                    {"detail": "You cannot view this video."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = VideoSerializer(video)
            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error getting video: {str(e)}")
            return Response(
                {"detail": "An error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        operation_id="delete_video",
        description="Delete a video (instructor owner only)",
        responses={204: None, 403: None, 404: None}
    )
    def delete(self, request, video_id):
        try:
            video = self.get_object(video_id)

            if not video:
                return Response(
                    {"detail": "Video not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check ownership
            permission = IsLessonOwnerOrAdmin()
            if not permission.has_object_permission(request, self, video.lesson):
                return Response(
                    {"detail": "You cannot delete this video."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            lesson = video.lesson

            # Delete from storage
            VideoStorageService.delete_video(video.storage_key)

            # Delete database record
            video.delete()

            # Update lesson to remove hosted video reference
            lesson.video_type = Lesson.VideoType.NONE
            lesson.save()

            logger.info(f"Video deleted successfully for lesson {lesson.id}")

            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )

        except Exception as e:
            logger.error(f"Error deleting video: {str(e)}")
            return Response(
                {"detail": "An error occurred during video deletion."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VideoReplaceView(APIView):
    """
    Replace an existing video for a lesson.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_lesson(self, lesson_id):
        """Get lesson with related objects."""
        return (
            Lesson.objects
            .select_related(
                "section",
                "section__course",
                "section__course__instructor",
            )
            .filter(id=lesson_id)
            .first()
        )

    def check_ownership(self, user, lesson):
        """Check if user owns the course containing the lesson."""
        if user.role == User.Role.ADMIN:
            return True

        if user.role == User.Role.INSTRUCTOR:
            course = lesson.section.course
            return course.instructor_id == user.id

        return False

    @extend_schema(
        operation_id="replace_video",
        description="Replace existing video for a lesson (instructor owner only)",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'video': {
                        'type': 'string',
                        'format': 'binary'
                    }
                }
            }
        },
        responses={200: VideoSerializer, 400: None, 403: None, 404: None}
    )
    def post(self, request, lesson_id):
        try:
            lesson = self.get_lesson(lesson_id)

            if not lesson:
                return Response(
                    {"detail": "Lesson not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check ownership
            if not self.check_ownership(request.user, lesson):
                return Response(
                    {"detail": "You can only replace videos in your own lessons."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if lesson has a hosted video
            if not Video.objects.filter(lesson=lesson).exists():
                return Response(
                    {"detail": "Lesson has no hosted video to replace. Use upload endpoint."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get video file from request
            video_file = request.FILES.get('video')
            if not video_file:
                return Response(
                    {"detail": "No video file provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate video file
            is_valid, error_msg = VideoStorageService.validate_video_file(video_file)
            if not is_valid:
                return Response(
                    {"detail": error_msg},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            old_video = Video.objects.filter(lesson=lesson).first()

            # Create new video record
            new_video = Video.objects.create(
                lesson=lesson,
                original_filename=video_file.name,
                file_size=video_file.size,
                mime_type=video_file.content_type,
                status=Video.Status.UPLOADING,
                storage_provider='supabase',
            )

            # Upload new video to storage
            try:
                storage_key, file_size = VideoStorageService.upload_video(
                    video_file,
                    lesson.id,
                    video_file.name
                )

                # Update new video record
                new_video.storage_key = storage_key
                new_video.file_size = file_size
                new_video.status = Video.Status.UPLOADED
                new_video.uploaded_at = timezone.now()
                new_video.save()

                # Generate playback URL
                playback_url = VideoStorageService.get_video_url(storage_key)
                new_video.playback_url = playback_url
                new_video.save()

                # Mark as READY for MVP
                new_video.status = Video.Status.READY
                new_video.processed_at = timezone.now()
                new_video.save()

                # Delete old video from storage
                VideoStorageService.delete_video(old_video.storage_key)

                # Delete old video record
                old_video.delete()

                logger.info(f"Video replaced successfully for lesson {lesson.id}")

                serializer = VideoSerializer(new_video)
                return Response(
                    serializer.data,
                    status=status.HTTP_200_OK,
                )

            except Exception as e:
                # Mark new video as failed
                new_video.status = Video.Status.FAILED
                new_video.error_message = str(e)
                new_video.save()

                logger.error(f"Video replacement failed for lesson {lesson.id}: {str(e)}")
                return Response(
                    {"detail": f"Video replacement failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            logger.error(f"Unexpected error during video replacement: {str(e)}")
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VideoPlaybackView(APIView):
    """
    Get playback information for a lesson's video.

    Learners can only access videos for courses they are enrolled in.
    """
    permission_classes = [IsAuthenticated]

    def get_lesson(self, lesson_id):
        """Get lesson with related objects."""
        return (
            Lesson.objects
            .select_related(
                "section",
                "section__course",
            )
            .filter(id=lesson_id)
            .first()
        )

    def check_enrollment(self, user, lesson):
        """
        Check if user is enrolled in the course containing the lesson.

        Authorization chain:
        - JWT authentication (handled by permission class)
        - Active enrollment in course
        - Course access
        - Lesson access
        - Video READY status
        """
        course = lesson.section.course

        # Admin and course owner can access any video
        if user.role == User.Role.ADMIN:
            return True

        if user.role == User.Role.INSTRUCTOR and course.instructor_id == user.id:
            return True

        # Check enrollment
        enrollment = Enrollment.objects.filter(
            learner=user,
            course=course,
            status=Enrollment.Status.ACTIVE
        ).first()

        return enrollment is not None

    @extend_schema(
        operation_id="get_video_playback",
        description="Get video playback information (enrolled learners only)",
        responses={200: VideoPublicSerializer, 403: None, 404: None}
    )
    def get(self, request, lesson_id):
        try:
            lesson = self.get_lesson(lesson_id)

            if not lesson:
                return Response(
                    {"detail": "Lesson not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check enrollment
            if not self.check_enrollment(request.user, lesson):
                return Response(
                    {"detail": "You must be enrolled in this course to access videos."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if lesson has hosted video
            video = Video.objects.filter(lesson=lesson).first()
            if not video:
                return Response(
                    {"detail": "Lesson has no hosted video."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check video status
            if video.status != Video.Status.READY:
                if video.status == Video.Status.FAILED:
                    return Response(
                        {"detail": "Video processing failed. Please contact the instructor."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )
                else:
                    return Response(
                        {"detail": f"Video is being processed (status: {video.status}). Please try again later."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

            # Return public video information
            serializer = VideoPublicSerializer(video)
            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error getting video playback: {str(e)}")
            return Response(
                {"detail": "An error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
