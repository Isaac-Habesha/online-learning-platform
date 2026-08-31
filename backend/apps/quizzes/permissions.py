from rest_framework import permissions
from apps.enrollments.models import Enrollment
from .models import Quiz

class IsQuizInstructorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True

        quiz = obj if isinstance(obj, Quiz) else getattr(obj, 'quiz', None)
        if not quiz:
            return False

        try:
            return quiz.lesson.section.course.instructor == request.user
        except AttributeError:
            return False


class CanAttemptQuiz(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True

        quiz = obj if isinstance(obj, Quiz) else getattr(obj, 'quiz', None)
        if not quiz:
            return False

        lesson = quiz.lesson
        if getattr(lesson, 'is_free_preview', False):
            return True

        course = lesson.section.course
        # Using 'learner' to match your custom Enrollment model field
        return Enrollment.objects.filter(
            learner=request.user, 
            course=course, 
            status='ACTIVE'
        ).exists()