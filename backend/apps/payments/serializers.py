from rest_framework import serializers
from .models import PaymentOrder


class InitializePaymentSerializer(serializers.Serializer):
    course_id = serializers.IntegerField(
        required=True,
        help_text="ID of the paid course to purchase",
    )


class PaymentOrderSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = PaymentOrder
        fields = [
            "id",
            "course",
            "course_title",
            "tx_ref",
            "amount",
            "currency",
            "status",
            "created_at",
        ]
        read_only_fields = fields
