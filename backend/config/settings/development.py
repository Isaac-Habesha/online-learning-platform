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
# Use SMTP backend for real email delivery
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_PORT = config("EMAIL_PORT", cast=int, default=465)
EMAIL_USE_SSL = config("EMAIL_USE_SSL", cast=bool, default=True)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", cast=bool, default=False)
