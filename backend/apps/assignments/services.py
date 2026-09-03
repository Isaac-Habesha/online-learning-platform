from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Assignment, AssignmentSubmission
from apps.enrollments.models import Enrollment


class AssignmentService:
    @staticmethod
    @transaction.atomic
    def submit_assignment(assignment: Assignment, user, text_submission=None, file_submission=None):
        if not assignment.is_published:
            raise PermissionDenied("Assignment is not active.")

        course = assignment.course
        # Using 'learner' to match your custom Enrollment model field
        is_enrolled = Enrollment.objects.filter(
            learner=user, 
            course=course, 
            status='ACTIVE'
        ).exists()
        
        if not is_enrolled:
            raise PermissionDenied("Active enrollment required to submit.")

        if not text_submission and not file_submission:
            raise ValidationError("You must provide either text content or an attachment.")

        # Lock submissions for this user & assignment to avoid concurrent submissions race condition
        latest_submission = AssignmentSubmission.objects.select_for_update().filter(
            assignment=assignment, 
            user=user
        ).order_by('-submitted_at').first()

        if latest_submission and latest_submission.status == AssignmentSubmission.Status.GRADED:
            raise ValidationError("Graded submissions cannot be modified or re-submitted.")

        is_late = bool(assignment.due_date and timezone.now() > assignment.due_date)

        submission = AssignmentSubmission.objects.create(
            assignment=assignment,
            user=user,
            text_submission=text_submission or "",
            file_submission=file_submission,
            is_late=is_late,
            status=AssignmentSubmission.Status.SUBMITTED
        )

        try:
            from apps.progress.services import update_enrollment_completion
            enrollment = Enrollment.objects.filter(
                learner=user, 
                course=course, 
                status=Enrollment.Status.ACTIVE
            ).first()
            if enrollment:
                update_enrollment_completion(enrollment=enrollment)
        except Exception:
            pass

        return submission

    @staticmethod
    @transaction.atomic
    def grade_submission(submission: AssignmentSubmission, instructor, grade: int, feedback: str = ""):
        # Acquire row lock on submission
        submission = AssignmentSubmission.objects.select_for_update(
    of=('self',)
).select_related(
    'assignment__lesson__section__course',
    'assignment__section__course'
).get(id=submission.id)

        course = submission.assignment.course
        is_admin = instructor.is_staff or getattr(instructor, 'role', '') == 'ADMIN'
        
        if course.instructor != instructor and not is_admin:
            raise PermissionDenied("Only the course instructor or admin can grade this assignment.")

        if grade > submission.assignment.max_marks:
            raise ValidationError(f"Grade cannot exceed max marks ({submission.assignment.max_marks}).")

        submission.grade = grade
        submission.feedback = feedback
        submission.graded_by = instructor
        submission.graded_at = timezone.now()
        submission.status = AssignmentSubmission.Status.GRADED
        submission.save()
        return submission