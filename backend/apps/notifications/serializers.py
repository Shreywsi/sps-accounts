from rest_framework import serializers

from apps.notifications.models import Message, Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(
        source="actor.username",
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = (
            "recipient",
            "recipient_role",
            "actor",
            "category",
            "title",
            "message",
            "link",
            "created_at",
        )


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(
        source="sender.username",
        read_only=True,
    )

    sender_role = serializers.CharField(
        source="sender.role",
        read_only=True,
    )

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = (
            "sender",
            "is_read",
            "created_at",
        )

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["sender"] = request.user

        # Default: reply to the opposite role if nobody specific chosen
        if not validated_data.get("recipient") and not validated_data.get(
            "recipient_role"
        ):
            validated_data["recipient_role"] = (
                "ADMIN" if request.user.role == "OPERATOR" else "OPERATOR"
            )

        return super().create(validated_data)