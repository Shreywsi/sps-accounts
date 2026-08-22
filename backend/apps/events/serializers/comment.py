from rest_framework import serializers

from apps.events.models import EventComment


class EventCommentSerializer(serializers.ModelSerializer):

    author_name = serializers.CharField(source="author.username", read_only=True)
    author_role = serializers.CharField(source="author.role", read_only=True)
    entry_title = serializers.CharField(
        source="entry.title", read_only=True, allow_null=True
    )

    class Meta:
        model = EventComment
        fields = (
            "id",
            "event",
            "entry",
            "entry_title",
            "author",
            "author_name",
            "author_role",
            "message",
            "created_at",
        )
        read_only_fields = ("author",)

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
