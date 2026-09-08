from django.urls import path
from .views import (
    NotificationListCreateView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)

urlpatterns = [
    path("", NotificationListCreateView.as_view(), name="notification-list-create"),
    path("<uuid:notification_id>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
    path("read-all/", MarkAllNotificationsReadView.as_view(), name="notification-read-all"),
]
