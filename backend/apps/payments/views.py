import logging
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User
from apps.courses.models import Course
from .models import PaymentOrder
from .serializers import InitializePaymentSerializer, PaymentOrderSerializer
from .services import (
    PaymentServiceError,
    initialize_chapa_payment,
    verify_and_fulfill_payment,
)

logger = logging.getLogger(__name__)


class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InitializePaymentSerializer

    @extend_schema(
        operation_id="initialize_chapa_payment",
        description="Initialize a Chapa payment checkout session for a paid course",
        request=InitializePaymentSerializer,
        responses={200: PaymentOrderSerializer},
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role != User.Role.LEARNER:
            return Response(
                {"detail": "Only learners can purchase courses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        course_id = serializer.validated_data["course_id"]
        course = get_object_or_404(Course, id=course_id)

        try:
            payment_info = initialize_chapa_payment(
                learner=request.user,
                course=course,
            )
            return Response(payment_info, status=status.HTTP_200_OK)
        except PaymentServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected payment error: {e}")
            return Response(
                {"detail": "Unable to initialize payment transaction at this time."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChapaWebhookView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="chapa_payment_webhook",
        description="Server-to-server webhook endpoint called by Chapa upon transaction status update",
    )
    def post(self, request):
        data = request.data or {}
        tx_ref = data.get("tx_ref") or request.query_params.get("tx_ref")
        
        if not tx_ref:
            # Check nested data structure from Chapa
            tx_ref = data.get("data", {}).get("tx_ref")

        if not tx_ref:
            return Response(
                {"detail": "Missing tx_ref parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order, is_success = verify_and_fulfill_payment(tx_ref=tx_ref)
            return Response(
                {
                    "status": "success" if is_success else "failed",
                    "tx_ref": tx_ref,
                    "order_status": order.status,
                },
                status=status.HTTP_200_OK,
            )
        except PaymentServiceError as e:
            logger.warning(f"Webhook verify error for {tx_ref}: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Webhook processing error for {tx_ref}: {e}")
            return Response({"detail": "Internal error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="verify_payment_status",
        description="Fallback verification endpoint for frontend polling when returning from Chapa",
    )
    def get(self, request, tx_ref):
        order = PaymentOrder.objects.filter(tx_ref=tx_ref, learner=request.user).first()
        if not order:
            return Response(
                {"detail": "Transaction order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # If already completed, return immediately
        if order.status == PaymentOrder.Status.COMPLETED:
            return Response(
                {
                    "status": "COMPLETED",
                    "course_id": order.course.id,
                    "tx_ref": order.tx_ref,
                    "amount": str(order.amount),
                },
                status=status.HTTP_200_OK,
            )

        # If still pending, query Chapa API directly to verify
        try:
            updated_order, is_success = verify_and_fulfill_payment(tx_ref=tx_ref)
            return Response(
                {
                    "status": updated_order.status,
                    "course_id": updated_order.course.id,
                    "tx_ref": updated_order.tx_ref,
                    "amount": str(updated_order.amount),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.warning(f"Fallback verification sync failed: {e}")
            return Response(
                {
                    "status": order.status,
                    "course_id": order.course.id,
                    "tx_ref": order.tx_ref,
                },
                status=status.HTTP_200_OK,
            )
