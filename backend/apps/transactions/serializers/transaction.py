from rest_framework import serializers

from apps.transactions.models import (
    Transaction,
    TransactionCategory,
    TransactionColumn,
    TransactionItem,
)


class TransactionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCategory
        fields = (
            "id",
            "name",
            "is_active",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        return TransactionCategory.objects.create(
            created_by=self.context["request"].user,
            **validated_data,
        )


class TransactionColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionColumn
        fields = ("id", "name", "is_active")
        read_only_fields = ("id",)

    def create(self, validated_data):
        return TransactionColumn.objects.create(
            created_by=self.context["request"].user,
            **validated_data,
        )


class TransactionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionItem
        fields = (
            "id",
            "title",
            "amount",
            "remarks",
        )


class TransactionSerializer(serializers.ModelSerializer):

    items = TransactionItemSerializer(many=True, required=False)
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Transaction
        fields = (
            "id",
            "transaction_type",
            "category",
            "category_name",
            "student",
            "transaction_date",
            "payment_mode",
            "narration",
            "custom_data",
            "status",
            "total_amount",
            "items",
            "created_by_name",
            "approved_by",
            "approved_at",
            "created_at",
        )
        read_only_fields = (
            "status",
            "approved_by",
            "approved_at",
            "total_amount",
        )

    def create(self, validated_data):

        items = validated_data.pop("items", [])

        transaction = Transaction.objects.create(
            created_by=self.context["request"].user,
            status=Transaction.Status.SUBMITTED,
            **validated_data,
        )

        total = 0

        for item in items:

            TransactionItem.objects.create(
                transaction=transaction,
                **item,
            )

            total += item["amount"]

        transaction.total_amount = total
        transaction.save()

        return transaction

    def update(self, instance, validated_data):
        """
        Operator edits to a SUBMITTED/REJECTED row (e.g. fixing a
        rejected entry and resubmitting). Approval itself goes through
        the dedicated approve/reject actions, not this serializer.
        """

        items = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if instance.status == Transaction.Status.REJECTED:
            instance.status = Transaction.Status.SUBMITTED
            instance.approved_by = None
            instance.approved_at = None

        if items is not None:
            instance.items.all().delete()
            total = 0
            for item in items:
                TransactionItem.objects.create(transaction=instance, **item)
                total += item["amount"]
            instance.total_amount = total

        instance.save()
        return instance