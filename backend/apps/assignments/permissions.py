from rest_framework import permissions
from apps.enrollments.models import Enrollment


class IsAssignmentInstructorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True

        course = obj.course if hasattr(obj, 'course') else getattr(obj.assignment, 'course', None)
        if not course:
            return False

        return course.instructor == request.user


class CanViewOrSubmitAssignment(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True

        course = obj.course if hasattr(obj, 'course') else getattr(obj.assignment, 'course', None)
        if not course:
            return False

        # Owners need read access to manage their assignments in the dashboard.
        if course.instructor == request.user:
            return True

        # Fixed: using 'learner' instead of 'user'
        return Enrollment.objects.filter(
            learner=request.user, 
            course=course, 
            status='ACTIVE'
        ).exists()