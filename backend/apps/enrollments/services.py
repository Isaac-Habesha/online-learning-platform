from django.db import transaction

from .models import Enrollment


class EnrollmentError(Exception):
    pass


@transaction.atomic
def enroll_learner(
    *,
    learner,
    course,
):

    if learner.role != learner.Role.LEARNER:
        raise EnrollmentError(
            "Only learners can enroll in courses."
        )

    if course.status != course.Status.PUBLISHED:
        raise EnrollmentError(
            "Only published courses can be enrolled in."
        )

    enrollment = Enrollment.objects.filter(
        learner=learner,
        course=course,
    ).first()

    if enrollment:
        if (
            enrollment.status
            == Enrollment.Status.CANCELLED
        ):
            enrollment.status = (
                Enrollment.Status.ACTIVE
            )

            enrollment.completed_at = None

            enrollment.save(
                update_fields=[
                    "status",
                    "completed_at",
                    "updated_at",
                ]
            )

            return enrollment

        raise EnrollmentError(
            "You are already enrolled in this course."
        )

    enrollment = Enrollment.objects.create(
        learner=learner,
        course=course,
    )

    # 1. Automatic Welcome Announcement from Instructor to Learner
    try:
        from apps.notifications.models import Notification
        instructor = course.instructor
        instructor_name = f"{instructor.first_name} {instructor.last_name}".strip() if instructor else "Academy Instructor"
        learner_name = learner.first_name.strip() if learner.first_name else "there"
        
        Notification.objects.create(
            type=Notification.Type.COURSE_ANNOUNCEMENT,
            title=f"Welcome to {course.title}!",
            body=f"Hi {learner_name}! Welcome to {course.title}. I'm {instructor_name}, your instructor. Feel free to use the Support Chat if you have questions or need guidance along the way. Happy studying!",
            course=course,
            sender=instructor,
            recipient=learner,
        )
    except Exception as e:
        pass

    # 2. Auto-initialize Support Chat Thread between Student and Instructor
    try:
        from apps.chat.models import Conversation, Message
        if course.instructor:
            conv, created = Conversation.objects.get_or_create(
                course=course,
                student=learner,
                defaults={"instructor": course.instructor},
            )
            if created:
                Message.objects.create(
                    conversation=conv,
                    sender=course.instructor,
                    body=f"Hi {learner_name}! Welcome to {course.title}. I'm your instructor, {instructor_name}. Feel free to ask any questions or share your progress right here!",
                )
    except Exception as e:
        pass

    return enrollment