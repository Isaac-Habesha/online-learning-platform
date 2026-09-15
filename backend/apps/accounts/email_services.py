from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import User


def generate_user_token(user):
    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    token = default_token_generator.make_token(user)

    return uid, token


def send_verification_email(
    user,
    raw_token,
):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"

    subject = "Verify your Online Learning Platform account"

    # Plain text fallback
    message = (
        f"Hello {user.first_name},\n\n"
        f"Thank you for registering.\n\n"
        f"Please verify your email address by opening this link:\n\n"
        f"{verification_url}\n\n"
        f"This verification link expires in 24 hours.\n\n"
        f"If you did not create this account, you can safely ignore this email.\n\n"
        f"Online Learning Platform"
    )

    # HTML formatted email for better deliverability and user experience
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <tr>
          <td style="padding: 32px 32px 16px 32px; text-align: center; background-color: #0f172a;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">LearnPulse</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Online Learning Platform</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Verify your email address</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Hello <strong>{user.first_name}</strong>,<br/><br/>
              Thank you for registering. Please click the button below to verify your email address and activate your account.
            </p>
            <table align="center" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #0284c7;">
                  <a href="{verification_url}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 8px;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
              Or copy and paste this link into your browser:<br/>
              <a href="{verification_url}" style="color: #0284c7; word-break: break-all;">{verification_url}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This verification link expires in 24 hours. If you did not create an account, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    recipient = user.email

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(
    user,
    raw_token,
):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"

    subject = "Reset your Online Learning Platform password"

    # Plain text fallback
    message = (
        f"Hello {user.first_name},\n\n"
        f"You requested a password reset.\n\n"
        f"Please open this link to create a new password:\n\n"
        f"{reset_url}\n\n"
        f"This password reset link expires in 1 hour.\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"Online Learning Platform"
    )

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <tr>
          <td style="padding: 32px 32px 16px 32px; text-align: center; background-color: #0f172a;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">LearnPulse</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Online Learning Platform</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Hello <strong>{user.first_name}</strong>,<br/><br/>
              We received a request to reset your password. Click the button below to choose a new password.
            </p>
            <table align="center" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #0284c7;">
                  <a href="{reset_url}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 8px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
              Or copy and paste this link into your browser:<br/>
              <a href="{reset_url}" style="color: #0284c7; word-break: break-all;">{reset_url}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This link expires in 1 hour. If you did not request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )




