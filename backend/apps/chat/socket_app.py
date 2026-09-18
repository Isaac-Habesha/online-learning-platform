import os
import sys
import logging
import django

# Ensure Django is setup if running standalone
if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    django.setup()

import socketio
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken
from apps.accounts.models import User
from apps.chat.models import Conversation, Message
from apps.chat.serializers import MessageSerializer

logger = logging.getLogger(__name__)

# Create Socket.io server with CORS allowed for dev
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


def authenticate_token(token_str):
    if not token_str:
        return None
    clean_token = token_str.replace("Bearer ", "").strip()
    try:
        validated = AccessToken(clean_token)
        user_id = validated.get("user_id")
        return user_id
    except Exception as e:
        logger.warning(f"Socket auth error: {e}")
        return None


@sio.event
async def connect(sid, environ, auth):
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")
    if not token:
        # Fallback check for query params
        query_string = environ.get("QUERY_STRING", "")
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=")[1]

    user_id = authenticate_token(token)
    if not user_id:
        logger.warning(f"Connection rejected for {sid}: unauthenticated")
        return False  # Reject connection

    await sio.save_session(sid, {"user_id": user_id})
    # Join user's personal room for direct notifications
    await sio.enter_room(sid, f"user_{user_id}")
    logger.info(f"Socket connected: sid={sid}, user_id={user_id}")
    return True


@sio.event
async def disconnect(sid):
    logger.info(f"Socket disconnected: sid={sid}")


@sio.on("conversation:join")
async def on_conversation_join(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    conv_id = data.get("conversationId")

    if not user_id or not conv_id:
        return

    # Check participant in database using sync_to_async
    from asgiref.sync import sync_to_async

    @sync_to_async
    def verify_participant():
        return Conversation.objects.filter(
            id=conv_id,
        ).filter(
            django.db.models.Q(student_id=user_id) | django.db.models.Q(instructor_id=user_id)
        ).exists()

    is_participant = await verify_participant()
    if is_participant:
        room_name = f"conv_{conv_id}"
        await sio.enter_room(sid, room_name)
        logger.info(f"User {user_id} joined room {room_name}")
    else:
        await sio.emit("error", {"detail": "Unauthorized for conversation"}, to=sid)


@sio.on("message:send")
async def on_message_send(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    conv_id = data.get("conversationId")
    body = (data.get("body") or "").strip()
    temp_id = data.get("tempId")

    if not user_id or not conv_id or not body:
        return

    from asgiref.sync import sync_to_async

    @sync_to_async
    def save_message():
        conv = Conversation.objects.filter(
            id=conv_id,
        ).filter(
            django.db.models.Q(student_id=user_id) | django.db.models.Q(instructor_id=user_id)
        ).select_related("student", "instructor", "course").first()

        if not conv:
            return None, None

        sender = User.objects.get(id=user_id)
        msg = Message.objects.create(
            conversation=conv,
            sender=sender,
            body=body,
        )
        conv.save(update_fields=["updated_at"])

        recipient_id = conv.instructor_id if user_id == conv.student_id else conv.student_id
        if user_id == conv.student_id:
            from apps.notifications.models import Notification
            Notification.objects.create(
                type=Notification.Type.CHAT_MESSAGE,
                title=f"New message from {sender.get_full_name() or sender.email}",
                body=f"{sender.get_full_name() or sender.email} sent you a new message in {conv.course.title}.",
                course=conv.course,
                sender=sender,
                recipient=conv.instructor,
                conversation=conv,
            )
        return MessageSerializer(msg).data, recipient_id

    msg_data, recipient_id = await save_message()
    if not msg_data:
        await sio.emit("error", {"detail": "Unauthorized"}, to=sid)
        return

    payload = {
        **msg_data,
        "tempId": temp_id,
    }

    # Emit to conversation room
    await sio.emit("message:new", payload, room=f"conv_{conv_id}")

    # Emit notification to recipient if outside room
    if recipient_id:
        await sio.emit("notification:new", {
            "type": "CHAT_MESSAGE",
            "title": f"New message from {msg_data.get('sender_name')}",
            "body": body[:100],
            "conversation_id": str(conv_id),
        }, room=f"user_{recipient_id}")


@sio.on("typing:start")
async def on_typing_start(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    conv_id = data.get("conversationId")
    if user_id and conv_id:
        await sio.emit("typing:start", {"userId": user_id, "conversationId": conv_id}, room=f"conv_{conv_id}", skip_sid=sid)


@sio.on("typing:stop")
async def on_typing_stop(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    conv_id = data.get("conversationId")
    if user_id and conv_id:
        await sio.emit("typing:stop", {"userId": user_id, "conversationId": conv_id}, room=f"conv_{conv_id}", skip_sid=sid)


@sio.on("message:read")
async def on_message_read(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    conv_id = data.get("conversationId")
    if not user_id or not conv_id:
        return

    from asgiref.sync import sync_to_async

    @sync_to_async
    def mark_read():
        from django.utils import timezone
        conv = Conversation.objects.filter(id=conv_id).select_related("student", "instructor").first()
        if conv:
            conv.messages.filter(read_at__isnull=True).exclude(sender_id=user_id).update(read_at=timezone.now())

    await mark_read()
    await sio.emit("messages:read", {"conversationId": conv_id}, room=f"conv_{conv_id}", skip_sid=sid)
