from rest_framework import serializers

from apps.fees.models import FeeCategory


class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = "__all__"