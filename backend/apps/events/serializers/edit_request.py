from rest_framework import serializers

from apps.events.models import EventEditRequest


class EventEditRequestSerializer(serializers.ModelSerializer):

    requested_by_name = serializers.CharField(
        source="requested_by.username", read_only=True
    )
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.username", read_only=True, allow_null=True
    )
    event_name = serializers.CharField(source="event.name", read_only=True)
    event_status = serializers.CharField(source="event.status", read_only=True)

    class Meta:
        model = EventEditRequest
        fields = (
            "id",
            "event",
            "event_name",
            "event_status",
            "requested_by",
            "requested_by_name",
            "reason",
            "status",
            "admin_note",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
        )
        read_only_fields = (
            "status",
            "requested_by",
            "admin_note",
            "reviewed_by",
            "reviewed_at",
        )

    def create(self, validated_data):
        validated_data["requested_by"] = self.context["request"].user
        return super().create(validated_data)