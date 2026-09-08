import logging
import uuid
import requests
from decimal import Decimal
from django.conf import settings
from django.db import transaction

from apps.enrollments.models import Enrollment
from apps.enrollments.services import enroll_learner, EnrollmentError
from .models import PaymentOrder

logger = logging.getLogger(__name__)

CHAPA_INIT_URL = f"{getattr(settings, 'CHAPA_BASE_URL', 'https://api.chapa.co/v1')}/transaction/initialize"
CHAPA_VERIFY_URL = f"{getattr(settings, 'CHAPA_BASE_URL', 'https://api.chapa.co/v1')}/transaction/verify/{{}}"


class PaymentServiceError(Exception):
    pass


def generate_tx_ref():
    return f"TX-LMS-{uuid.uuid4().hex[:14].upper()}"


@transaction.atomic
def initialize_chapa_payment(*, learner, course):
    """
    Initializes a transaction with Chapa for a paid course.
    Enforces server-side checks that the course is paid and user is not already enrolled.
    """
    if course.is_free or course.price <= Decimal("0.00"):
        raise PaymentServiceError("This course is free. Please use the direct enrollment option.")

    # Check active enrollment
    active_enrollment = Enrollment.objects.filter(
        learner=learner,
        course=course,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).exists()
    if active_enrollment:
        raise PaymentServiceError("You are already enrolled in this course.")

    tx_ref = generate_tx_ref()
    while PaymentOrder.objects.filter(tx_ref=tx_ref).exists():
        tx_ref = generate_tx_ref()

    order = PaymentOrder.objects.create(
        learner=learner,
        course=course,
        tx_ref=tx_ref,
        amount=course.price,
        currency="ETB",
        status=PaymentOrder.Status.PENDING,
    )

    chapa_secret_key = getattr(settings, "CHAPA_SECRET_KEY", "").strip()
    if not chapa_secret_key:
        logger.warning("CHAPA_SECRET_KEY is not configured in settings.")

    backend_url = getattr(settings, "BACKEND_URL", "http://localhost:8000").rstrip("/")
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

    callback_url = f"{backend_url}/api/payments/webhook/"
    return_url = f"{frontend_url}/payment-success?tx_ref={tx_ref}"

    headers = {
        "Authorization": f"Bearer {chapa_secret_key}",
        "Content-Type": "application/json",
    }

    first_name = learner.first_name.strip() if learner.first_name else "Student"
    last_name = learner.last_name.strip() if learner.last_name else "Learner"

    payload = {
        "amount": str(course.price),
        "currency": "ETB",
        "email": learner.email,
        "first_name": first_name,
        "last_name": last_name,
        "tx_ref": tx_ref,
        "callback_url": callback_url,
        "return_url": return_url,
        "customization[title]": f"Course: {course.title[:30]}",
        "customization[description]": f"Enrollment in {course.title}",
    }

    try:
        response = requests.post(CHAPA_INIT_URL, json=payload, headers=headers, timeout=15)
        res_data = response.json()
    except Exception as e:
        logger.error(f"Chapa API request failed: {e}")
        raise PaymentServiceError(f"Could not connect to payment provider: {str(e)}")

    if response.status_code == 200 and res_data.get("status") == "success":
        checkout_url = res_data.get("data", {}).get("checkout_url")
        return {
            "order_id": order.id,
            "tx_ref": tx_ref,
            "checkout_url": checkout_url,
            "amount": order.amount,
            "currency": order.currency,
        }
    else:
        err_msg = res_data.get("message") or "Payment gateway failed to initialize checkout."
        logger.error(f"Chapa init failed: {res_data}")
        order.status = PaymentOrder.Status.FAILED
        order.save(update_fields=["status", "updated_at"])
        raise PaymentServiceError(f"Payment initialization failed: {err_msg}")


@transaction.atomic
def verify_and_fulfill_payment(*, tx_ref):
    """
    Verifies transaction status directly with Chapa API.
    If valid, transitions order to COMPLETED and enrolls the learner.
    Idempotent: safe to be called multiple times by webhook or frontend fallback.
    """
    order = PaymentOrder.objects.select_for_update().filter(tx_ref=tx_ref).first()
    if not order:
        raise PaymentServiceError(f"Order with tx_ref {tx_ref} not found.")

    if order.status == PaymentOrder.Status.COMPLETED:
        # Already fulfilled
        return order, True

    chapa_secret_key = getattr(settings, "CHAPA_SECRET_KEY", "").strip()
    headers = {
        "Authorization": f"Bearer {chapa_secret_key}",
    }

    verify_url = CHAPA_VERIFY_URL.format(tx_ref)
    try:
        response = requests.get(verify_url, headers=headers, timeout=15)
        res_data = response.json()
    except Exception as e:
        logger.error(f"Chapa verify request failed for tx_ref {tx_ref}: {e}")
        raise PaymentServiceError(f"Payment verification request failed: {str(e)}")

    if response.status_code == 200 and res_data.get("status") == "success":
        data = res_data.get("data", {})
        chapa_status = data.get("status")

        if chapa_status == "success":
            order.status = PaymentOrder.Status.COMPLETED
            order.chapa_reference = data.get("reference", "")
            order.save(update_fields=["status", "chapa_reference", "updated_at"])

            # Fulfill enrollment
            try:
                enroll_learner(learner=order.learner, course=order.course)
            except EnrollmentError as e:
                # If already enrolled, ensure it is active
                enrollment = Enrollment.objects.filter(
                    learner=order.learner,
                    course=order.course,
                ).first()
                if enrollment and enrollment.status != Enrollment.Status.ACTIVE:
                    enrollment.status = Enrollment.Status.ACTIVE
                    enrollment.save(update_fields=["status", "updated_at"])

            return order, True
        else:
            order.status = PaymentOrder.Status.FAILED
            order.save(update_fields=["status", "updated_at"])
            return order, False
    else:
        logger.warning(f"Chapa verification failed or pending: {res_data}")
        return order, False
