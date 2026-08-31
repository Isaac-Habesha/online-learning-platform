from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Review
from .serializers import ReviewSerializer, CourseReviewStatsSerializer
from .permissions import CanReviewCourse, IsReviewAuthorOrAdmin
from .services import ReviewService


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Review.objects.select_related('user', 'course')

        # Admins and staff can view all reviews (including hidden/moderated ones)
        if user and user.is_authenticated and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
            queryset = queryset.all()
        else:
            # Regular users and public can only see non-hidden reviews
            queryset = queryset.filter(is_hidden=False)

        # Allow filtering by course via query parameters (e.g. /api/v1/reviews/?course=1)
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), CanReviewCourse()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsReviewAuthorOrAdmin()]
        elif self.action == 'moderate':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course_id = request.data.get('course')
        if not course_id:
            raise ValidationError({'course': 'This field is required.'})

        review = ReviewService.create_review(
            user=request.user,
            course_id=int(course_id),
            rating=serializer.validated_data.get('rating'),
            comment=serializer.validated_data.get('comment', '')
        )

        output_serializer = self.get_serializer(review)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='course-stats/(?P<course_id>[^/.]+)')
    def course_stats(self, request, course_id=None):
        stats = ReviewService.get_course_stats(course_id=int(course_id))
        serializer = CourseReviewStatsSerializer(data=stats)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def moderate(self, request, pk=None):
        """Admin action to toggle review visibility or hide abusive content."""
        review = self.get_object()
        is_hidden = request.data.get('is_hidden', not review.is_hidden)
        review.is_hidden = bool(is_hidden)
        review.save(update_fields=['is_hidden', 'updated_at'])
        return Response({
            "status": "Review moderation status updated.",
            "is_hidden": review.is_hidden
        }, status=status.HTTP_200_OK)