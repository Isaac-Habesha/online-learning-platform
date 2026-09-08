from django.contrib import admin
from .models import PaymentOrder


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = [
        "tx_ref",
        "learner",
        "course",
        "amount",
        "currency",
        "status",
        "created_at",
    ]
    list_filter = ["status", "currency", "created_at"]
    search_fields = [
        "tx_ref",
        "learner__email",
        "course__title",
        "chapa_reference",
    ]
    readonly_fields = [
        "id",
        "tx_ref",
        "learner",
        "course",
        "amount",
        "currency",
        "chapa_reference",
        "created_at",
        "updated_at",
    ]
