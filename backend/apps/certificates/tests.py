from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.courses.models import Course, CourseSection, Lesson
from apps.enrollments.models import Enrollment
from apps.certificates.models import Certificate
from apps.certificates.services import issue_certificate_if_eligible, render_certificate_pdf

User = get_user_model()


class CertificateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            password="Password123!",
            first_name="Dr. Jane",
            last_name="Doe",
            role=User.Role.INSTRUCTOR,
            email_verified=True,
        )
        self.learner = User.objects.create_user(
            email="learner@test.com",
            password="Password123!",
            first_name="Alice",
            last_name="Smith",
            role=User.Role.LEARNER,
            email_verified=True,
        )
        self.category = Category.objects.create(name="Computer Science", slug="cs")
        self.course = Course.objects.create(
            instructor=self.instructor,
            title="Full-Stack Web Engineering",
            category=self.category,
            status=Course.Status.PUBLISHED,
            price=Decimal("0.00"),
            is_free=True,
        )
        self.enrollment = Enrollment.objects.create(
            learner=self.learner,
            course=self.course,
            status=Enrollment.Status.ACTIVE,
        )

    def test_certificate_not_eligible_when_active(self):
        self.client.force_authenticate(user=self.learner)
        url = reverse("course-certificate", kwargs={"course_id": self.course.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("is_completed"))

    def test_certificate_issuance_when_completed(self):
        self.enrollment.status = Enrollment.Status.COMPLETED
        self.enrollment.save()

        cert = issue_certificate_if_eligible(enrollment=self.enrollment)
        self.assertIsNotNone(cert)
        self.assertEqual(cert.learner_full_name, "Alice Smith")
        self.assertEqual(cert.course_title, "Full-Stack Web Engineering")
        self.assertEqual(cert.instructor_name, "Dr. Jane Doe")
        self.assertTrue(cert.certificate_code.startswith("CERT-"))
        self.assertTrue(bool(cert.pdf_file))

        # Test authenticated learner retrieval
        self.client.force_authenticate(user=self.learner)
        url = reverse("course-certificate", kwargs={"course_id": self.course.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_completed"])
        self.assertEqual(response.data["certificate"]["certificate_code"], cert.certificate_code)

        # Test public verification endpoint (unauthenticated)
        self.client.logout()
        verify_url = reverse("verify-certificate", kwargs={"certificate_code": cert.certificate_code})
        verify_res = self.client.get(verify_url)
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data["is_valid"])
        self.assertEqual(verify_res.data["learner_full_name"], "Alice Smith")

        # Test invalid certificate verification
        invalid_url = reverse("verify-certificate", kwargs={"certificate_code": "CERT-NONEXISTENT"})
        invalid_res = self.client.get(invalid_url)
        self.assertEqual(invalid_res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(invalid_res.data["is_valid"])
