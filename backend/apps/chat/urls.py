from django.urls import path
from .views import (
    ConversationListCreateView,
    MessageListCreateView,
    MarkConversationReadView,
)

urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="chat-conversations"),
    path("conversations/<uuid:conversation_id>/messages/", MessageListCreateView.as_view(), name="chat-messages"),
    path("conversations/<uuid:conversation_id>/read/", MarkConversationReadView.as_view(), name="chat-mark-read"),
]
