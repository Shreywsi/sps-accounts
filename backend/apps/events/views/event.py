from django.db.models import Prefetch
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.events.models import Event, EventCategory
from apps.events.permissions import IsAdminRole, can_edit_event
from apps.events.serializers import CategoryNodeSerializer, EventSerializer
from apps.notifications.utils import notify_admins, notify_operators


class EventViewSet(viewsets.ModelViewSet):
    """
    The 'folders' list. Operators see their own; admins see everyone's
    and can filter by ?status=SUBMITTED etc.
    """

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "event_date", "created_by"]

    def get_queryset(self):
        qs = Event.objects.select_related("created_by", "approved_by")
        user = self.request.user
        if user.role != "ADMIN":
            qs = qs.filter(created_by=user)
        return qs

    def perform_create(self, serializer):
        event = serializer.save()
        notify_admins(
            actor=self.request.user,
            category="GENERAL",
            title="New event submitted",
            message=(
                f"{self.request.user.username} created the event "
                f"'{event.name}' ({event.event_date})."
            ),
            link="/admin/events",
        )

    def perform_update(self, serializer):
        event = self.get_object()
        if not can_edit_event(self.request.user, event):
            raise PermissionDenied(
                "This event is approved and locked, or isn't yours to edit."
            )
        serializer.save()

    def perform_destroy(self, instance):
        if not can_edit_event(self.request.user, instance):
            raise PermissionDenied(
                "This event is approved and locked, or isn't yours to delete."
            )
        instance.delete()

    @action(detail=True, methods=["get"])
    def tree(self, request, pk=None):
        """Full nested category/sub-category/entry tree for one event,
        with running subtotals — this is the 'open the folder' view."""
        event = self.get_object()

        categories = EventCategory.objects.filter(
            event=event
        ).select_related("event").prefetch_related(
            "entries",
            Prefetch("children", queryset=EventCategory.objects.all()),
        )

        top_level = sorted(
            [c for c in categories if c.parent_id is None],
            key=lambda c: c.name.lower(),
        )

        data = CategoryNodeSerializer(
            top_level, many=True, context={"request": request}
        ).data

        return Response({
            "event": EventSerializer(event, context={"request": request}).data,
            "categories": data,
        })

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminRole])
    def approve(self, request, pk=None):
        event = self.get_object()
        event.status = Event.Status.APPROVED
        event.approved_by = request.user
        event.approved_at = timezone.now()
        event.save()

        notify_operators(
            actor=request.user,
            category="GENERAL",
            title="Event approved",
            message=f"'{event.name}' was approved by {request.user.username}.",
            recipient=event.created_by,
            link="/operator/events",
        )
        return Response(EventSerializer(event, context={"request": request}).data)

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminRole])
    def reject(self, request, pk=None):
        event = self.get_object()
        event.status = Event.Status.REJECTED
        event.approved_by = request.user
        event.approved_at = timezone.now()
        event.save()

        reason = request.data.get("reason", "")
        if reason:
            event.comments.create(author=request.user, message=reason)

        notify_operators(
            actor=request.user,
            category="GENERAL",
            title="Event rejected",
            message=f"'{event.name}' was rejected by {request.user.username}.",
            recipient=event.created_by,
            link="/operator/events",
        )
        return Response(EventSerializer(event, context={"request": request}).data)
