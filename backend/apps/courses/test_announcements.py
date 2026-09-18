from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.chat.models import Conversation, Message
from apps.courses.models import Announcement, Course
from apps.enrollments.models import Enrollment
from apps.notifications.models import Notification, NotificationRead


User = get_user_model()


class AnnouncementAndMessageFeatureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@example.com",
            password="test-password",
            first_name="Course",
            last_name="Instructor",
            role=User.Role.INSTRUCTOR,
        )
        self.other_instructor = User.objects.create_user(
            email="other@example.com",
            password="test-password",
            first_name="Other",
            last_name="Instructor",
            role=User.Role.INSTRUCTOR,
        )
        self.learner = User.objects.create_user(
            email="learner@example.com",
            password="test-password",
            first_name="Course",
            last_name="Learner",
            role=User.Role.LEARNER,
        )
        self.outsider = User.objects.create_user(
            email="outsider@example.com",
            password="test-password",
            first_name="Outside",
            last_name="Learner",
            role=User.Role.LEARNER,
        )
        self.course = Course.objects.create(
            instructor=self.instructor,
            title="Testing Course",
            short_description="Course summary",
            description="Course description",
            status=Course.Status.PUBLISHED,
        )
        Enrollment.objects.create(learner=self.learner, course=self.course)

    def test_enrolled_learner_can_view_announcements(self):
        announcement = Announcement.objects.create(
            course=self.course,
            instructor=self.instructor,
            title="Welcome",
            message="Start here.",
            live_stream_url="https://example.com/live",
        )
        self.client.force_authenticate(self.learner)
        response = self.client.get(f"/api/courses/{self.course.id}/announcements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["id"], announcement.id)

    def test_non_enrolled_learner_cannot_view_announcements(self):
        self.client.force_authenticate(self.outsider)
        response = self.client.get(f"/api/courses/{self.course.id}/announcements/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_can_create_and_edit_announcement(self):
        self.client.force_authenticate(self.instructor)
        create_response = self.client.post(
            f"/api/courses/{self.course.id}/announcements/",
            {"title": "Live class", "message": "Tomorrow", "live_stream_url": "https://example.com/live"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        announcement_id = create_response.data["id"]
        edit_response = self.client.patch(
            f"/api/courses/announcements/{announcement_id}/",
            {"message": "Tomorrow at 10:00"},
            format="json",
        )
        self.assertEqual(edit_response.status_code, status.HTTP_200_OK)
        self.assertEqual(edit_response.data["message"], "Tomorrow at 10:00")

    def test_other_instructor_cannot_edit_announcement(self):
        announcement = Announcement.objects.create(
            course=self.course,
            instructor=self.instructor,
            title="Private",
            message="Message",
        )
        self.client.force_authenticate(self.other_instructor)
        response = self.client.patch(
            f"/api/courses/announcements/{announcement.id}/",
            {"message": "Changed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_message_creates_instructor_notification(self):
        conversation = Conversation.objects.create(
            course=self.course,
            student=self.learner,
            instructor=self.instructor,
        )
        self.client.force_authenticate(self.learner)
        response = self.client.post(
            f"/api/chat/conversations/{conversation.id}/messages/",
            {"body": "I need help with this lesson."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(conversation=conversation)
        self.assertEqual(notification.recipient, self.instructor)
        self.assertEqual(notification.sender, self.learner)
        self.assertEqual(notification.type, Notification.Type.CHAT_MESSAGE)
        self.assertFalse(NotificationRead.objects.filter(notification=notification).exists())
        self.assertTrue(Message.objects.filter(id=response.data["id"]).exists())
