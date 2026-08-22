from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.events.models import EventComment
from apps.events.serializers import EventCommentSerializer
from apps.notifications.utils import notify


class EventCommentViewSet(viewsets.ModelViewSet):
    """
    Review comments. Filter by ?event=<id> (general + all entry
    comments for that folder) or ?event=<id>&entry=<id>.
    Both roles can post — admin verifying, operator clarifying.
    """

    serializer_class = EventCommentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["event", "entry"]

    def get_queryset(self):
        qs = EventComment.objects.select_related("author", "entry", "event")
        user = self.request.user
        if user.role != "ADMIN":
            qs = qs.filter(event__created_by=user)
        return qs

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        event = comment.event

        # Notify "the other side" of the conversation.
        if self.request.user.role == "ADMIN":
            notify(
                recipient=event.created_by,
                actor=self.request.user,
                category="GENERAL",
                title="New comment on your event",
                message=f"{self.request.user.username} commented on '{event.name}'.",
                link="/operator/events",
            )
        else:
            notify(
                recipient_role="ADMIN",
                actor=self.request.user,
                category="GENERAL",
                title="New comment on an event",
                message=f"{self.request.user.username} commented on '{event.name}'.",
                link="/admin/events",
            )
