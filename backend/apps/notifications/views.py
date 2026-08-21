from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.models import Message, Notification
from apps.notifications.serializers import (
    MessageSerializer,
    NotificationSerializer,
)


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(
            Q(recipient=user) | Q(recipient_role=user.role)
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "ok"})


class MessageViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            Message.objects.filter(
                Q(sender=user) | Q(recipient=user) | Q(recipient_role=user.role)
            )
            .select_related("sender")
        )

    def perform_create(self, serializer):
        message = serializer.save()

        Notification.objects.create(
            recipient=message.recipient,
            recipient_role=message.recipient_role,
            actor=message.sender,
            category="MESSAGE",
            title=f"New message from {message.sender.username}",
            message=message.body[:200],
            link="/messages",
        )