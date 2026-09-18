from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient


User = get_user_model()


class GoogleAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.google_identity = {
            "google_id": "google-user-123",
            "email": "new-user@example.com",
            "first_name": "New",
            "last_name": "User",
            "picture": "",
        }

    @patch("apps.accounts.views.verify_google_credential")
    def test_google_signup_creates_verified_learner_and_tokens(self, verify):
        verify.return_value = self.google_identity

        response = self.client.post(
            "/api/accounts/google/",
            {"credential": "valid-google-token", "role": User.Role.LEARNER},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(email="new-user@example.com")
        self.assertEqual(user.role, User.Role.LEARNER)
        self.assertTrue(user.email_verified)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

    @patch("apps.accounts.views.verify_google_credential")
    def test_google_signin_uses_existing_account_and_preserves_role(self, verify):
        verify.return_value = self.google_identity
        user = User.objects.create_user(
            email="new-user@example.com",
            password="password123",
            first_name="Existing",
            last_name="Instructor",
            role=User.Role.INSTRUCTOR,
        )

        response = self.client.post(
            "/api/accounts/google/",
            {"credential": "valid-google-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], user.id)
        self.assertEqual(response.data["user"]["role"], User.Role.INSTRUCTOR)
        self.assertEqual(User.objects.filter(email="new-user@example.com").count(), 1)

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_google_auth_reports_missing_server_configuration(self):
        response = self.client.post(
            "/api/accounts/google/",
            {"credential": "token", "role": User.Role.LEARNER},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("not configured", response.data["detail"])
