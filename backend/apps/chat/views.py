from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User
from apps.courses.models import Course
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ChatPagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = "page_size"
    max_page_size = 100


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="list_conversations",
        description="List all support chat conversations the current user is a participant in",
        responses={200: ConversationSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        conversations = Conversation.objects.filter(
            models_q_user(user)
        ).select_related("course", "student", "instructor").prefetch_related("messages")
        serializer = ConversationSerializer(conversations, many=True, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        operation_id="create_or_get_conversation",
        description="Get or create a 1-on-1 support conversation for a course",
        responses={200: ConversationSerializer, 201: ConversationSerializer},
    )
    def post(self, request):
        course_id = request.data.get("course_id")
        if not course_id:
            return Response({"detail": "course_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)
        user = request.user

        if user.role == User.Role.LEARNER:
            student = user
            instructor = course.instructor
        else:
            student_id = request.data.get("student_id")
            if not student_id:
                return Response(
                    {"detail": "student_id is required when creating a conversation as an instructor."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            student = get_object_or_404(User, id=student_id)
            instructor = user

        conv, created = Conversation.objects.get_or_create(
            course=course,
            student=student,
            defaults={"instructor": instructor},
        )

        serializer = ConversationSerializer(conv, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


def models_q_user(user):
    from django.db.models import Q
    return Q(student=user) | Q(instructor=user)


class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = ChatPagination

    def get_conversation(self, conv_id, user):
        return get_object_or_404(
            Conversation,
            id=conv_id,
            student=user if user.role == User.Role.LEARNER else None,
        ) if user.role == User.Role.LEARNER else get_object_or_404(
            Conversation.objects.filter(models_q_user(user)),
            id=conv_id,
        )

    @extend_schema(
        operation_id="get_conversation_messages",
        description="Retrieve paginated message history for a conversation (descending by timestamp)",
        responses={200: MessageSerializer(many=True)},
    )
    def get(self, request, conversation_id):
        conv = self.get_conversation(conversation_id, request.user)
        messages = conv.messages.select_related("sender").order_by("-created_at")

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        operation_id="send_conversation_message",
        description="Send a message to a conversation via REST fallback",
        request=MessageSerializer,
        responses={201: MessageSerializer},
    )
    def post(self, request, conversation_id):
        conv = self.get_conversation(conversation_id, request.user)
        body = request.data.get("body", "").strip()
        if not body:
            return Response({"detail": "Message body cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            body=body,
        )
        conv.updated_at = timezone.now()
        conv.save(update_fields=["updated_at"])

        serializer = MessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MarkConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="mark_conversation_read",
        description="Mark all incoming messages in a conversation as read",
    )
    def post(self, request, conversation_id):
        conv = get_object_or_404(
            Conversation.objects.filter(models_q_user(request.user)),
            id=conversation_id,
        )
        updated_count = conv.messages.filter(read_at__isnull=True).exclude(sender=request.user).update(read_at=timezone.now())
        return Response({"read_count": updated_count}, status=status.HTTP_200_OK)
