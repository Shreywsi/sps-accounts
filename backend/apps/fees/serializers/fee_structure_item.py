from rest_framework import serializers

from apps.fees.models import FeeStructureItem


class FeeStructureItemSerializer(serializers.ModelSerializer):

    fee_category_name = serializers.CharField(
        source="fee_category.name",
        read_only=True,
    )

    class Meta:
        model = FeeStructureItem
        fields = "__all__"