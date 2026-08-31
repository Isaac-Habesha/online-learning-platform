from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.courses.models import Lesson

class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    passing_score = models.PositiveIntegerField(
        default=70, 
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Percentage score required to pass"
    )
    time_limit_minutes = models.PositiveIntegerField(
        default=0, 
        help_text="0 indicates no time limit"
    )
    max_attempts = models.PositiveIntegerField(
        default=3, 
        help_text="Maximum number of attempts allowed per learner"
    )
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"Quiz: {self.title} ({self.lesson.title})"

class Question(models.Model):
    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = 'MCQ', 'Multiple Choice'
        TRUE_FALSE = 'TF', 'True/False'

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    question_type = models.CharField(max_length=10, choices=QuestionType.choices, default=QuestionType.MULTIPLE_CHOICE)
    points = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    order = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True, help_text="Explanation shown after attempt submission")

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['quiz', 'order'], name='unique_quiz_question_order')
        ]

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}: {self.prompt[:30]}"

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.question.id} - {self.text[:30]}"

class QuizAttempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        TIMED_OUT = 'TIMED_OUT', 'Timed Out'

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    score = models.FloatField(null=True, blank=True)
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']
        constraints = [
            models.UniqueConstraint(fields=['quiz', 'user', 'attempt_number'], name='unique_quiz_user_attempt')
        ]

    def __str__(self):
        return f"{self.user.email} - {self.quiz.title} (Attempt {self.attempt_number})"

class QuizAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['attempt', 'question'], name='unique_attempt_question_answer')
        ]