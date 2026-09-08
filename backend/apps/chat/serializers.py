from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source="sender.role", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "sender_role",
            "body",
            "created_at",
            "read_at",
        ]
        read_only_fields = ["id", "conversation", "sender", "created_at", "read_at"]

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name if name else obj.sender.email


class ConversationSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    student_name = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "course",
            "course_title",
            "student",
            "student_name",
            "instructor",
            "instructor_name",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_student_name(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name if name else obj.student.email

    def get_instructor_name(self, obj):
        name = f"{obj.instructor.first_name} {obj.instructor.last_name}".strip()
        return name if name else obj.instructor.email

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return {
            "id": str(msg.id),
            "body": msg.body[:80],
            "sender_id": msg.sender_id,
            "created_at": msg.created_at.isoformat(),
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return 0
        return obj.messages.filter(read_at__isnull=True).exclude(sender=request.user).count()
