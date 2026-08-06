from rest_framework import serializers

from apps.transactions.models import (
    Transaction,
    TransactionItem,
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

    items = TransactionItemSerializer(many=True)

    class Meta:
        model = Transaction
        fields = (
            "id",
            "transaction_type",
            "student",
            "transaction_date",
            "payment_mode",
            "narration",
            "status",
            "total_amount",
            "items",
        )

    def create(self, validated_data):

        items = validated_data.pop("items")

        transaction = Transaction.objects.create(
            created_by=self.context["request"].user,
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