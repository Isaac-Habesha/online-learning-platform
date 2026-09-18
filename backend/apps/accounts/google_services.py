from google.auth.transport import requests
from google.oauth2 import id_token

from django.conf import settings


class GoogleAuthenticationError(Exception):
    pass


def verify_google_credential(credential):
    """
    Verify a Google ID token and return trusted Google identity data.
    """

    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise GoogleAuthenticationError(
            "Google authentication is not configured on the server."
        )

    if not credential or not isinstance(credential, str):
        raise GoogleAuthenticationError("Google credential is required.")

    try:
        google_data = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            client_id,
        )

    except (ValueError, TypeError) as exc:
        raise GoogleAuthenticationError(
            "Invalid Google credential."
        ) from exc

    issuer = google_data.get("iss")

    if issuer not in {
        "accounts.google.com",
        "https://accounts.google.com",
    }:
        raise GoogleAuthenticationError(
            "Invalid Google token issuer."
        )

    email = google_data.get("email")

    if not email:
        raise GoogleAuthenticationError(
            "Google account does not contain an email address."
        )

    if not google_data.get("email_verified", False):
        raise GoogleAuthenticationError(
            "Google email address is not verified."
        )

    google_id = google_data.get("sub")

    if not google_id:
        raise GoogleAuthenticationError(
            "Google account ID is missing."
        )

    return {
        "google_id": google_id,
        "email": email.lower().strip(),
        "first_name": (google_data.get("given_name") or "Google").strip(),
        "last_name": (google_data.get("family_name") or "User").strip(),
        "picture": google_data.get(
            "picture",
            "",
        ),
    }