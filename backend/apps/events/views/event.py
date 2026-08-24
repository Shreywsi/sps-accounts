from django.db.models import Prefetch
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import RolePermission
from apps.common.mixins import ActivityLoggingMixin
from apps.events.models import Event, EventCategory
from apps.events.permissions import IsAdminRole, EventObjectPermission
from apps.events.serializers import CategoryNodeSerializer, EventSerializer
from apps.notifications.utils import notify_admins, notify_operators


class EventViewSet(ActivityLoggingMixin, viewsets.ModelViewSet):
    """
    The 'folders' list. Operators see their own; admins see everyone's
    and can filter by ?status=SUBMITTED etc.

    Write access to an already-APPROVED event is blocked twice:
      1. EventObjectPermission -> rejects the request at the API layer
         (also enforces "only the creator or an admin may edit").
      2. Event.save()          -> rejects the write at the model layer,
         so the guarantee holds even outside this viewset.
    """

    serializer_class = EventSerializer
    permission_classes = [RolePermission, EventObjectPermission]
    filterset_fields = ["status", "event_date", "created_by"]

    activity_target_model = "Event"
    activity_watched_fields = ("name", "event_date", "description", "status")
    activity_action_map = {
        "create": "CREATE_EVENT",
        "update": "UPDATE_EVENT",
        "partial_update": "UPDATE_EVENT",
        "destroy": "DELETE_EVENT",
        "approve": "APPROVE_EVENT",
        "reject": "REJECT_EVENT",
    }

    def _describe(self, instance):
        return f"{instance.name} ({instance.event_date})"

    def get_queryset(self):
        qs = Event.objects.select_related("created_by", "approved_by")
        user = self.request.user
        if user.role != "ADMIN":
            qs = qs.filter(created_by=user)
        return qs

    def perform_create(self, serializer):
        event = serializer.save()
        self._log("create", event)
        # Events now start as DRAFT — don't ping admins until the
        # operator actually submits it for review.

    def perform_update(self, serializer):
        was_draft = serializer.instance.status == Event.Status.DRAFT
        event = serializer.save()
        self._log(
            "partial_update" if self.request.method == "PATCH" else "update",
            event,
        )
        if was_draft and event.status == Event.Status.SUBMITTED:
            notify_admins(
                actor=self.request.user,
                category="GENERAL",
                title="New event submitted",
                message=(
                    f"{self.request.user.username} submitted the event "
                    f"'{event.name}' ({event.event_date}) for review."
                ),
                link="/admin/events",
            )

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
        self.log_custom_action("approve", event)

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
        self.log_custom_action("reject", event)

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