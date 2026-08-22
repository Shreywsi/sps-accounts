from rest_framework import serializers

from apps.events.models import EventCategory


class EventCategorySerializer(serializers.ModelSerializer):
    """Flat serializer used for creating/renaming/deleting a single
    category node. Use EventTreeSerializer (views/event.py -> tree
    action) to fetch the whole nested folder view."""

    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )

    class Meta:
        model = EventCategory
        fields = (
            "id",
            "event",
            "parent",
            "name",
            "created_by",
            "created_by_name",
            "created_at",
        )
        read_only_fields = ("created_by",)

    def validate(self, attrs):
        event = attrs.get("event") or getattr(self.instance, "event", None)
        parent = attrs.get("parent") if "parent" in attrs else getattr(
            self.instance, "parent", None
        )

        if parent and event and parent.event_id != event.id:
            raise serializers.ValidationError(
                "Parent category must belong to the same event."
            )

        if parent and self.instance and parent_id_is_descendant(parent, self.instance):
            raise serializers.ValidationError(
                "A category cannot be nested inside its own sub-category."
            )

        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


def parent_id_is_descendant(candidate_parent, instance):
    """True if candidate_parent is instance itself or one of its
    descendants (which would create a cycle)."""
    node = candidate_parent
    while node is not None:
        if node.id == instance.id:
            return True
        node = node.parent
    return False
