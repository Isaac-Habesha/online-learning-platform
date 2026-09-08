import sys
from .base import *

DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    ".ngrok-free.app",
    ".ngrok.io",
    "*",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://*.ngrok-free.app",
    "https://*.ngrok.io",
]

# Use in-memory SQLite for automated tests to ensure test suite isolation
if "test" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

# Email Configuration for Development
# Option 1: File-based backend (saves emails to files)
EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend"
EMAIL_FILE_PATH = BASE_DIR / "sent_emails"

# Option 2: Console backend (prints to console)
# EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# #Option 3: SMTP configuration (uncomment and configure to use with services like Gmail, Mailgun, etc.)
# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
# EMAIL_HOST = "smtp.gmail.com"  # or your SMTP server
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = "hugeboss171@gmail.com"
# EMAIL_HOST_PASSWORD = "milekejzxjihethw"  # Use app-specific password for Gmail

DEFAULT_FROM_EMAIL = "noreply@onlinelearning.local"
