from rest_framework import serializers

from apps.expenses.models import ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = ExpenseCategory
        fields = "__all__"