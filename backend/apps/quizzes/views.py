from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.courses.models import Lesson
from .models import Quiz, QuizAttempt
from .serializers import (
    QuizSerializer, 
    LearnerQuizSerializer, 
    QuizSubmissionSerializer, 
    QuizAttemptResultSerializer
)
from .permissions import IsQuizInstructorOrAdmin, CanAttemptQuiz
from .services import QuizAttemptService


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related(
        'lesson__section__course__instructor'
    ).prefetch_related(
        'questions__options'
    ).all()

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Quiz.objects.none()

        # Admins see everything
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return self.queryset

        # Instructors see their own quizzes; Learners see only published quizzes
        if getattr(user, 'role', '') == 'INSTRUCTOR':
            return self.queryset.filter(
                Q(lesson__section__course__instructor=user) | Q(is_published=True)
            )

        return self.queryset.filter(is_published=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsQuizInstructorOrAdmin()]
        elif self.action in ['retrieve', 'start', 'submit', 'results']:
            return [IsAuthenticated(), CanAttemptQuiz()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        user = self.request.user
        if user and user.is_authenticated:
            if user.is_staff or getattr(user, 'role', '') in ['INSTRUCTOR', 'ADMIN']:
                return QuizSerializer
        return LearnerQuizSerializer

    def perform_create(self, serializer):
        user = self.request.user
        lesson_id = self.request.data.get('lesson')
        
        if not lesson_id:
            raise ValidationError({'lesson': 'This field is required.'})

        lesson = get_object_or_404(Lesson, id=lesson_id)
        
        # Verify that the requesting instructor owns the course
        if not (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
            if lesson.section.course.instructor != user:
                raise PermissionDenied("You can only create quizzes for your own courses.")

        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAttemptQuiz])
    def start(self, request, pk=None):
        quiz = self.get_object()
        attempt = QuizAttemptService.start_attempt(quiz, request.user)
        return Response({
            "attempt_id": attempt.id,
            "attempt_number": attempt.attempt_number,
            "started_at": attempt.started_at,
            "time_limit_minutes": quiz.time_limit_minutes
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAttemptQuiz])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        attempt = get_object_or_404(
            QuizAttempt, 
            quiz=quiz, 
            user=request.user, 
            status=QuizAttempt.Status.IN_PROGRESS
        )
        serializer = QuizSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        completed_attempt = QuizAttemptService.submit_attempt(
            attempt, 
            serializer.validated_data['answers']
        )
        return Response(QuizAttemptResultSerializer(completed_attempt).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, CanAttemptQuiz])
    def results(self, request, pk=None):
        quiz = self.get_object()
        user = request.user

        # Instructors/Admins can see all attempts if they pass ?user_id=, otherwise user sees their own
        if user.is_staff or getattr(user, 'role', '') in ['INSTRUCTOR', 'ADMIN']:
            target_user_id = request.query_params.get('user_id')
            if target_user_id:
                attempts = QuizAttempt.objects.filter(quiz=quiz, user_id=target_user_id)
            else:
                attempts = QuizAttempt.objects.filter(quiz=quiz)
        else:
            attempts = QuizAttempt.objects.filter(quiz=quiz, user=user)

        attempts = attempts.prefetch_related('answers__question__options')
        return Response(QuizAttemptResultSerializer(attempts, many=True).data)