from rest_framework import permissions
from apps.enrollments.models import Enrollment
from apps.courses.models import Course


class CanReviewCourse(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only requests (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Must be authenticated to submit a review
        if not request.user or not request.user.is_authenticated:
            return False

        # Extract course ID from URL kwargs, query params, or body
        course_id = (
            view.kwargs.get('course_id') 
            or request.data.get('course') 
            or request.data.get('course_id')
        )
        if not course_id:
            return False

        # Prevent instructor from reviewing their own course
        course = Course.objects.filter(id=course_id).first()
        if course and course.instructor == request.user:
            return False

        # Check completed enrollment using 'learner' field
        return Enrollment.objects.filter(
            learner=request.user, 
            course_id=course_id, 
            status='COMPLETED'
        ).exists()


class IsReviewAuthorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow read-only access
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # Admins and staff can edit/delete/moderate
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True

        # Only the review author can update or delete their review
        return obj.user == request.user