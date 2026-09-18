from .base import *

DEBUG = False

ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS",
    cast=lambda value: [host.strip() for host in value.split(",")],
    default="localhost",
)

FRONTEND_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in config("FRONTEND_URL", default="").split(",")
    if origin.strip()
]

CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in config(
        "CORS_ALLOWED_ORIGINS",
        default=",".join(FRONTEND_ORIGINS),
    ).split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in config(
        "CSRF_TRUSTED_ORIGINS",
        default=",".join(FRONTEND_ORIGINS),
    ).split(",")
    if origin.strip()
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", cast=bool, default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", cast=int, default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True