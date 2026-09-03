from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Quiz, QuizAttempt, QuizAnswer, Question, Option
from apps.enrollments.models import Enrollment

class QuizAttemptService:
    @staticmethod
    @transaction.atomic
    def start_attempt(quiz: Quiz, user) -> QuizAttempt:
        if not quiz.is_published:
            raise PermissionDenied("Quiz is not currently available.")

        course = quiz.lesson.section.course
        # Using 'learner' to match the Enrollment model field name
        is_enrolled = Enrollment.objects.filter(learner=user, course=course, status='ACTIVE').exists()
        if not is_enrolled and not getattr(quiz.lesson, 'is_free_preview', False):
            raise PermissionDenied("You must be enrolled to take this quiz.")

        # Check for any active in-progress attempt first
        in_progress = QuizAttempt.objects.filter(
            quiz=quiz, 
            user=user, 
            status=QuizAttempt.Status.IN_PROGRESS
        ).first()
        if in_progress:
            return in_progress

        # Lock rows for this user and quiz to avoid duplicate attempt numbers under concurrent requests
        existing_attempts = QuizAttempt.objects.select_for_update().filter(quiz=quiz, user=user)
        attempt_count = existing_attempts.count()

        if attempt_count >= quiz.max_attempts:
            raise ValidationError(f"Maximum attempt limit ({quiz.max_attempts}) reached.")

        return QuizAttempt.objects.create(
            quiz=quiz,
            user=user,
            attempt_number=attempt_count + 1,
            status=QuizAttempt.Status.IN_PROGRESS
        )

    @staticmethod
    @transaction.atomic
    def submit_attempt(attempt: QuizAttempt, answers_data: list) -> QuizAttempt:
        # Acquire row lock during evaluation
        attempt = QuizAttempt.objects.select_for_update().get(id=attempt.id)

        if attempt.status != QuizAttempt.Status.IN_PROGRESS:
            raise ValidationError("This attempt has already been submitted or closed.")

        quiz = attempt.quiz
        if quiz.time_limit_minutes > 0:
            elapsed = (timezone.now() - attempt.started_at).total_seconds()
            # 30-second network latency grace period
            if elapsed > (quiz.time_limit_minutes * 60) + 30:
                attempt.status = QuizAttempt.Status.TIMED_OUT
                attempt.submitted_at = timezone.now()
                attempt.score = 0.0
                attempt.passed = False
                attempt.save()
                raise ValidationError("Time limit exceeded. Attempt marked as Timed Out.")

        questions = {q.id: q for q in quiz.questions.prefetch_related('options').all()}
        if not questions:
            raise ValidationError("This quiz does not have any questions configured.")
        total_points = sum(q.points for q in questions.values())
        earned_points = 0
        answers_to_create = []

        # Prevent duplicate answer submissions for the same question within one payload
        seen_questions = set()

        for item in answers_data:
            question_id = item.get('question_id')
            option_id = item.get('selected_option_id')

            if not question_id or question_id in seen_questions:
                continue

            question = questions.get(question_id)
            if not question:
                continue

            seen_questions.add(question_id)
            selected_option = None
            is_correct = False

            if option_id:
                selected_option = next((opt for opt in question.options.all() if opt.id == option_id), None)
                if selected_option and selected_option.is_correct:
                    is_correct = True
                    earned_points += question.points

            answers_to_create.append(
                QuizAnswer(
                    attempt=attempt,
                    question=question,
                    selected_option=selected_option,
                    is_correct=is_correct
                )
            )

        QuizAnswer.objects.bulk_create(answers_to_create)

        percentage_score = (earned_points / total_points * 100) if total_points > 0 else 0.0
        attempt.score = round(percentage_score, 2)
        attempt.passed = attempt.score >= quiz.passing_score
        attempt.status = QuizAttempt.Status.SUBMITTED
        attempt.submitted_at = timezone.now()
        attempt.save()

        if attempt.passed:
            try:
                from apps.enrollments.models import Enrollment
                from apps.progress.services import update_enrollment_completion
                course = quiz.lesson.section.course
                enrollment = Enrollment.objects.filter(
                    learner=attempt.user,
                    course=course,
                    status=Enrollment.Status.ACTIVE
                ).first()
                if enrollment:
                    update_enrollment_completion(enrollment=enrollment)
            except Exception:
                pass

        return attempt