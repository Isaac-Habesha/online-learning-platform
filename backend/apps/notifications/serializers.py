from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    sender_name = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "body",
            "course",
            "course_title",
            "sender",
            "sender_name",
            "recipient",
            "conversation",
            "created_at",
            "is_read",
        ]
        read_only_fields = ["id", "created_at", "sender", "conversation", "is_read"]

    def get_sender_name(self, obj):
        if not obj.sender:
            return "Academy Administration"
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name if name else obj.sender.email

    def get_is_read(self, obj):
        user = self.context.get("request", None)
        if not user or not user.user or not user.user.is_authenticated:
            return False
        read_ids = self.context.get("read_notification_ids", set())
        return str(obj.id) in read_ids or obj.id in read_ids
