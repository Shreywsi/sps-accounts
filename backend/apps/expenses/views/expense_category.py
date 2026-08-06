from rest_framework import viewsets

from apps.expenses.models import ExpenseCategory
from apps.expenses.serializers import ExpenseCategorySerializer


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer