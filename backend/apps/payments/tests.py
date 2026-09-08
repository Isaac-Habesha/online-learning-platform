from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.payments.models import PaymentOrder

User = get_user_model()


class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="prof@test.com",
            password="Password123!",
            first_name="Prof",
            last_name="Alan",
            role=User.Role.INSTRUCTOR,
            email_verified=True,
        )
        self.learner = User.objects.create_user(
            email="student@test.com",
            password="Password123!",
            first_name="Bob",
            last_name="Marley",
            role=User.Role.LEARNER,
            email_verified=True,
        )
        self.category = Category.objects.create(name="Design", slug="design")
        self.free_course = Course.objects.create(
            instructor=self.instructor,
            title="Intro to Design",
            category=self.category,
            status=Course.Status.PUBLISHED,
            price=Decimal("0.00"),
            is_free=True,
        )
        self.paid_course = Course.objects.create(
            instructor=self.instructor,
            title="Mastering Advanced UI/UX",
            category=self.category,
            status=Course.Status.PUBLISHED,
            price=Decimal("499.00"),
            is_free=False,
        )

    def test_free_course_rejected_for_payment_initialization(self):
        self.client.force_authenticate(user=self.learner)
        url = reverse("payment-initialize")
        response = self.client.post(url, {"course_id": self.free_course.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("free", response.data.get("detail", "").lower())

    @patch("apps.payments.services.requests.post")
    def test_paid_course_payment_initialization(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "status": "success",
            "data": {
                "checkout_url": "https://checkout.chapa.co/checkout/test-session-123"
            },
        }

        self.client.force_authenticate(user=self.learner)
        url = reverse("payment-initialize")
        response = self.client.post(url, {"course_id": self.paid_course.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("checkout_url", response.data)
        self.assertIn("tx_ref", response.data)

        order = PaymentOrder.objects.filter(tx_ref=response.data["tx_ref"]).first()
        self.assertIsNotNone(order)
        self.assertEqual(order.status, PaymentOrder.Status.PENDING)
        self.assertEqual(order.amount, Decimal("499.00"))

    @patch("apps.payments.services.requests.get")
    def test_payment_webhook_fulfillment(self, mock_get):
        tx_ref = "TX-LMS-TEST12345"
        order = PaymentOrder.objects.create(
            learner=self.learner,
            course=self.paid_course,
            tx_ref=tx_ref,
            amount=Decimal("499.00"),
            status=PaymentOrder.Status.PENDING,
        )

        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "status": "success",
            "data": {
                "status": "success",
                "reference": "CHAPA-REF-9988",
                "tx_ref": tx_ref,
            },
        }

        webhook_url = reverse("payment-webhook")
        response = self.client.post(webhook_url, {"tx_ref": tx_ref})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, PaymentOrder.Status.COMPLETED)
        self.assertEqual(order.chapa_reference, "CHAPA-REF-9988")

        # Verify learner was automatically enrolled
        enrollment = Enrollment.objects.filter(learner=self.learner, course=self.paid_course).first()
        self.assertIsNotNone(enrollment)
        self.assertEqual(enrollment.status, Enrollment.Status.ACTIVE)
