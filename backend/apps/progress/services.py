from django.db import transaction
from django.utils import timezone
from django.db.models import Count, Q

from apps.courses.models import Lesson

from apps.enrollments.models import Enrollment

from .models import LessonProgress

class ProgressError(Exception):
    pass


@transaction.atomic
def start_lesson(
    *,
    learner,
    lesson,
):

    enrollment = (
        Enrollment.objects
        .filter(
            learner=learner,
            course=lesson.section.course,
            status__in=[
                Enrollment.Status.ACTIVE,
                Enrollment.Status.COMPLETED,
            ],
        )
        .first()
    )

    if not enrollment:
        raise ProgressError(
            "You are not enrolled in this course."
        )

    progress, created = (
        LessonProgress.objects.get_or_create(
            learner=learner,
            lesson=lesson,
            defaults={
                "enrollment": enrollment,
                "started_at": timezone.now(),
                "last_accessed_at": timezone.now(),
            },
        )
    )

    if not created:
        progress.last_accessed_at = timezone.now()

        if not progress.started_at:
            progress.started_at = timezone.now()

        progress.save(
            update_fields=[
                "started_at",
                "last_accessed_at",
                "updated_at",
            ]
        )

    return progress


@transaction.atomic
def complete_lesson(
    *,
    learner,
    lesson,
):

    enrollment = (
        Enrollment.objects
        .filter(
            learner=learner,
            course=lesson.section.course,
            status__in=[
                Enrollment.Status.ACTIVE,
                Enrollment.Status.COMPLETED,
            ],
        )
        .first()
    )

    if not enrollment:
        raise ProgressError(
            "You are not enrolled in this course."
        )

    progress = (
        LessonProgress.objects
        .filter(
            learner=learner,
            lesson=lesson,
        )
        .first()
    )

    if not progress:
        raise ProgressError(
            "You must start the lesson before completing it."
        )

    if not progress.started_at:
        raise ProgressError(
            "You must start the lesson before completing it."
        )

    now = timezone.now()

    progress.completed = True
    progress.completed_at = (
        progress.completed_at or now
    )
    progress.last_accessed_at = now

    update_enrollment_completion(
        enrollment=enrollment,
    )

    progress.save(
        update_fields=[
            "completed",
            "completed_at",
            "last_accessed_at",
            "updated_at",
        ]
    )

    return progress


def get_course_progress(
    *,
    learner,
    course,
):
    from apps.quizzes.models import Quiz
    from apps.assignments.models import Assignment

    # 1. Lessons
    total_lessons = Lesson.objects.filter(
        section__course=course,
    ).count()

    completed_lessons = Lesson.objects.filter(
        section__course=course,
        learner_progress__learner=learner,
        learner_progress__completed=True,
    ).count()

    # 2. Quizzes (Learner must pass the quiz)
    course_quizzes = Quiz.objects.filter(
        lesson__section__course=course,
        is_published=True,
    )
    total_quizzes = course_quizzes.count()
    passed_quizzes = course_quizzes.filter(
        attempts__user=learner,
        attempts__passed=True,
    ).distinct().count()

    # 3. Project Assignments (Learner must submit deliverable)
    course_assignments = Assignment.objects.filter(
        Q(lesson__section__course=course) | Q(section__course=course),
        is_published=True,
    )
    total_assignments = course_assignments.count()
    submitted_assignments = course_assignments.filter(
        submissions__user=learner,
    ).distinct().count()

    # Aggregate completion calculation
    total_items = total_lessons + total_quizzes + total_assignments
    completed_items = completed_lessons + passed_quizzes + submitted_assignments

    if total_items == 0:
        percentage = 0.0
    else:
        percentage = round((completed_items / total_items) * 100, 2)

    # A course is completed IF AND ONLY IF all lessons are done, all quizzes passed, and all assignments submitted
    is_completed = (
        total_items > 0
        and completed_lessons == total_lessons
        and passed_quizzes == total_quizzes
        and submitted_assignments == total_assignments
    )

    return {
        "course_id": course.id,
        "course_title": course.title,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "total_quizzes": total_quizzes,
        "passed_quizzes": passed_quizzes,
        "total_assignments": total_assignments,
        "submitted_assignments": submitted_assignments,
        "total_items": total_items,
        "completed_items": completed_items,
        "progress_percentage": percentage,
        "is_completed": is_completed,
    }


def update_enrollment_completion(
    *,
    enrollment,
):
    progress_info = get_course_progress(
        learner=enrollment.learner,
        course=enrollment.course,
    )

    if (
        progress_info["is_completed"]
        and enrollment.status == Enrollment.Status.ACTIVE
    ):
        enrollment.status = Enrollment.Status.COMPLETED
        enrollment.completed_at = timezone.now()
        enrollment.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )
        try:
            from apps.certificates.services import issue_certificate_if_eligible
            issue_certificate_if_eligible(enrollment=enrollment)
        except Exception as e:
            # Certificate generation failure shouldn't rollback progress completion
            pass
        return True

    return False