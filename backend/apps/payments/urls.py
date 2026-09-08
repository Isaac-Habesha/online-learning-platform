from django.urls import path
from .views import (
    InitializePaymentView,
    ChapaWebhookView,
    VerifyPaymentStatusView,
)

urlpatterns = [
    path("initialize/", InitializePaymentView.as_view(), name="payment-initialize"),
    path("webhook/", ChapaWebhookView.as_view(), name="payment-webhook"),
    path("verify/<str:tx_ref>/", VerifyPaymentStatusView.as_view(), name="payment-verify"),
]
