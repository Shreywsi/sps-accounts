from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.events.models import Event, EventEditRequest
from apps.events.permissions import IsAdminRole, is_admin
from apps.events.serializers import EventEditRequestSerializer
from apps.notifications.utils import notify_admins, notify_operators


class EventEditRequestViewSet(viewsets.ModelViewSet):
    """
    Operators ask to unlock an APPROVED event; admins see every
    request in one place (pending + history) and approve/deny.
    """

    serializer_class = EventEditRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]
    filterset_fields = ["status", "event"]

    def get_queryset(self):
        qs = EventEditRequest.objects.select_related(
            "event", "requested_by", "reviewed_by"
        )
        user = self.request.user
        if not is_admin(user):
            qs = qs.filter(requested_by=user)
        return qs

    def perform_create(self, serializer):
        event = serializer.validated_data.get("event")
        user = self.request.user

        if event.created_by_id != user.id:
            raise PermissionDenied("You can only request edits on your own events.")
        if event.status != Event.Status.APPROVED:
            raise ValidationError(
                "This event isn't locked — you can edit it directly."
            )
        if event.edit_requests.filter(status=EventEditRequest.Status.PENDING).exists():
            raise ValidationError("There's already a pending edit request for this event.")

        edit_request = serializer.save()

        notify_admins(
            actor=user,
            category="GENERAL",
            title="Edit request submitted",
            message=(
                f"{user.username} requested to edit the locked event "
                f"'{event.name}' ({event.event_date})."
            ),
            link="/admin/requests",
        )

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminRole])
    def approve(self, request, pk=None):
        edit_request = self.get_object()
        if edit_request.status != EventEditRequest.Status.PENDING:
            raise ValidationError("This request has already been reviewed.")

        edit_request.status = EventEditRequest.Status.APPROVED
        edit_request.admin_note = request.data.get("note", "")
        edit_request.reviewed_by = request.user
        edit_request.reviewed_at = timezone.now()
        edit_request.save()

        event = edit_request.event
        event.status = Event.Status.SUBMITTED
        event.save()

        notify_operators(
            actor=request.user,
            category="GENERAL",
            title="Edit request approved",
            message=(
                f"You can now edit '{event.name}' — "
                f"{request.user.username} unlocked it for you."
            ),
            recipient=edit_request.requested_by,
            link=f"/operator/events/{event.id}",
        )
        return Response(
            EventEditRequestSerializer(edit_request, context={"request": request}).data
        )

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminRole])
    def deny(self, request, pk=None):
        edit_request = self.get_object()
        if edit_request.status != EventEditRequest.Status.PENDING:
            raise ValidationError("This request has already been reviewed.")

        edit_request.status = EventEditRequest.Status.DENIED
        edit_request.admin_note = request.data.get("note", "")
        edit_request.reviewed_by = request.user
        edit_request.reviewed_at = timezone.now()
        edit_request.save()

        notify_operators(
            actor=request.user,
            category="GENERAL",
            title="Edit request denied",
            message=(
                f"{request.user.username} denied your edit request for "
                f"'{edit_request.event.name}'"
                + (f": {edit_request.admin_note}" if edit_request.admin_note else ".")
            ),
            recipient=edit_request.requested_by,
            link=f"/operator/events/{edit_request.event.id}",
        )
        return Response(
            EventEditRequestSerializer(edit_request, context={"request": request}).data
        )