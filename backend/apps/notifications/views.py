from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from .models import Notification, NotificationRead
from .serializers import NotificationSerializer


class NotificationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="list_notifications",
        description="Retrieve list of announcements, course notices, and direct instructor messages for the current user",
        responses={200: NotificationSerializer(many=True)},
    )
    def get(self, request):
        user = request.user

        # User is enrolled courses
        enrolled_course_ids = Enrollment.objects.filter(
            learner=user,
            status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
        ).select_related("course").values_list("course_id", flat=True)

        # Instructor courses
        instructor_course_ids = Course.objects.filter(
            instructor=user
        ).values_list("id", flat=True)

        relevant_course_ids = list(enrolled_course_ids) + list(instructor_course_ids)

        notifications = Notification.objects.filter(
            Q(recipient=user) |
            Q(course_id__in=relevant_course_ids, recipient__isnull=True) |
            Q(course__isnull=True, recipient__isnull=True)
        ).select_related("course", "sender", "conversation").prefetch_related("conversation__student", "conversation__instructor").order_by("-created_at")[:50]

        # Read notification IDs
        read_notification_ids = set(
            NotificationRead.objects.filter(user=user).values_list("notification_id", flat=True)
        )

        unread_count = sum(1 for n in notifications if n.id not in read_notification_ids)

        serializer = NotificationSerializer(
            notifications,
            many=True,
            context={
                "request": request,
                "read_notification_ids": read_notification_ids,
            },
        )

        return Response({
            "unread_count": unread_count,
            "results": serializer.data,
        })

    @extend_schema(
        operation_id="create_notification",
        description="Create an announcement to all course students or a direct notice to an enrolled student",
        request=NotificationSerializer,
        responses={201: NotificationSerializer},
    )
    def post(self, request):
        user = request.user
        if user.role not in [User.Role.INSTRUCTOR, User.Role.ADMIN]:
            return Response(
                {"detail": "Only instructors and administrators can create announcements."},
                status=status.HTTP_403_FORBIDDEN,
            )

        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        course_id = request.data.get("course_id")
        recipient_id = request.data.get("recipient_id")
        notif_type = request.data.get("type", Notification.Type.COURSE_ANNOUNCEMENT)

        if not title or not body:
            return Response(
                {"detail": "Title and body are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course = None
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            if user.role == User.Role.INSTRUCTOR and course.instructor != user:
                return Response(
                    {"detail": "You can only post announcements for your own courses."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        recipient = None
        if recipient_id:
            recipient = get_object_or_404(User, id=recipient_id)
            notif_type = Notification.Type.INSTRUCTOR_MESSAGE

        notification = Notification.objects.create(
            type=notif_type,
            title=title,
            body=body,
            course=course,
            sender=user,
            recipient=recipient,
        )

        serializer = NotificationSerializer(notification, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="mark_notification_read",
        description="Mark a single notification as read",
    )
    def post(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id)
        enrolled_course_ids = Enrollment.objects.filter(
            learner=request.user,
            status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
        ).select_related("course").values_list("course_id", flat=True)
        can_access = (
            notification.recipient_id == request.user.id
            or (
                notification.recipient_id is None
                and notification.course_id in enrolled_course_ids
            )
            or (
                notification.recipient_id is None
                and notification.course_id is None
            )
            or (
                request.user.role == User.Role.INSTRUCTOR
                and notification.course
                and notification.course.instructor_id == request.user.id
            )
        )
        if not can_access:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        NotificationRead.objects.get_or_create(user=request.user, notification=notification)
        return Response({"status": "success"}, status=status.HTTP_200_OK)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="mark_all_notifications_read",
        description="Mark all user's notifications as read",
    )
    def post(self, request):
        user = request.user
        enrolled_course_ids = Enrollment.objects.filter(
            learner=user,
            status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
        ).select_related("course").values_list("course_id", flat=True)

        notifications = Notification.objects.filter(
            Q(recipient=user) |
            Q(course_id__in=enrolled_course_ids, recipient__isnull=True) |
            Q(course__isnull=True, recipient__isnull=True)
        ).select_related("course", "sender", "conversation")

        existing_read_ids = set(
            NotificationRead.objects.filter(user=user).values_list("notification_id", flat=True)
        )

        to_create = [
            NotificationRead(user=user, notification=n)
            for n in notifications
            if n.id not in existing_read_ids
        ]

        NotificationRead.objects.bulk_create(to_create, ignore_conflicts=True)
        return Response({"marked_count": len(to_create)}, status=status.HTTP_200_OK)
