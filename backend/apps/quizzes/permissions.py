from rest_framework import permissions
from apps.enrollments.models import Enrollment
from .models import Quiz
from apps.courses.models import Lesson

class IsQuizInstructorOrAdmin(permissions.BasePermission):
    message = "You must be the instructor or admin to perform this action."
    
    def has_permission(self, request, view):
        """Check class-level permission (for create, list, etc.)"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins and staff can always create quizzes
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True
        
        # For create, need to check if lesson belongs to user's course
        if view.action == 'create':
            lesson_id = request.data.get('lesson')
            if lesson_id:
                try:
                    lesson = Lesson.objects.get(id=lesson_id)
                    return lesson.section.course.instructor == request.user
                except Lesson.DoesNotExist:
                    return False
        
        # For other actions that require object permission
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check object-level permission (for retrieve, update, destroy, etc.)"""
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

        # Instructors must be able to open their own quizzes from the builder.
        if quiz.lesson.section.course.instructor == request.user:
            return True

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