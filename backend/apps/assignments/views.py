from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.courses.models import Lesson, CourseSection
from .models import Assignment, AssignmentSubmission
from .serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    GradeSubmissionSerializer,
)
from .permissions import IsAssignmentInstructorOrAdmin, CanViewOrSubmitAssignment
from .services import AssignmentService


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related(
        'lesson__section__course__instructor',
        'section__course__instructor'
    ).all()
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Assignment.objects.none()

        # Admins see everything
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return self.queryset

        # Instructors see their own assignments; Learners see only published ones
        if getattr(user, 'role', '') == 'INSTRUCTOR':
            return self.queryset.filter(
                Q(lesson__section__course__instructor=user) |
                Q(section__course__instructor=user) |
                Q(is_published=True)
            ).distinct()

        return self.queryset.filter(is_published=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAssignmentInstructorOrAdmin()]
        elif self.action in ['retrieve', 'submit', 'my_submissions']:
            return [IsAuthenticated(), CanViewOrSubmitAssignment()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        lesson_id = self.request.data.get('lesson')
        section_id = self.request.data.get('section')

        if not lesson_id and not section_id:
            raise ValidationError("An assignment must belong to either a Lesson or a Course Section.")

        course = None
        if lesson_id:
            lesson = get_object_or_404(Lesson.objects.select_related('section__course'), id=lesson_id)
            course = lesson.section.course
        elif section_id:
            section = get_object_or_404(CourseSection.objects.select_related('course'), id=section_id)
            course = section.course

        # Verify instructor owns the target course
        if not (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
            if course.instructor != user:
                raise PermissionDenied("You can only create assignments for your own courses.")

        serializer.save()

    @action(
        detail=True, 
        methods=['post'], 
        parser_classes=[MultiPartParser, FormParser, JSONParser],
        permission_classes=[IsAuthenticated, CanViewOrSubmitAssignment]
    )
    def submit(self, request, pk=None):
        assignment = self.get_object()
        
        # Validate through serializer first to enforce file limits and types
        serializer = AssignmentSubmissionSerializer(
            data=request.data, 
            context={'request': request, 'assignment': assignment}
        )
        serializer.is_valid(raise_exception=True)

        submission = AssignmentService.submit_assignment(
            assignment=assignment,
            user=request.user,
            text_submission=serializer.validated_data.get('text_submission'),
            file_submission=request.FILES.get('file_submission')
        )
        return Response(AssignmentSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, 
        methods=['get'],
        permission_classes=[IsAuthenticated, CanViewOrSubmitAssignment]
    )
    def my_submissions(self, request, pk=None):
        assignment = self.get_object()
        submissions = AssignmentSubmission.objects.filter(
            assignment=assignment, 
            user=request.user
        ).select_related('graded_by')
        return Response(AssignmentSubmissionSerializer(submissions, many=True).data)


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssignmentSubmission.objects.select_related(
        'assignment__lesson__section__course__instructor',
        'assignment__section__course__instructor',
        'user',
        'graded_by'
    ).all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return AssignmentSubmission.objects.none()

        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return self.queryset

        # Instructors see submissions for courses they teach; learners see only their own
        return self.queryset.filter(
            Q(user=user) |
            Q(assignment__lesson__section__course__instructor=user) |
            Q(assignment__section__course__instructor=user)
        ).distinct()

    @action(
        detail=True, 
        methods=['post'], 
        permission_classes=[IsAuthenticated, IsAssignmentInstructorOrAdmin]
    )
    def grade(self, request, pk=None):
        submission = self.get_object()
        
        serializer = GradeSubmissionSerializer(
            data=request.data,
            context={'submission': submission}
        )
        serializer.is_valid(raise_exception=True)

        graded = AssignmentService.grade_submission(
            submission=submission,
            instructor=request.user,
            grade=serializer.validated_data['grade'],
            feedback=serializer.validated_data.get('feedback', '')
        )
        return Response(AssignmentSubmissionSerializer(graded).data, status=status.HTTP_200_OK)