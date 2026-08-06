from rest_framework import serializers

from apps.expenses.models import Expense


class ExpenseSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = (
            "created_by",
        )

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)