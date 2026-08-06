from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.models import Expense
from apps.expenses.serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related(
        "category",
        "created_by",
    )
    serializer_class = ExpenseSerializer


class ExpenseDashboardAPIView(APIView):

    def get(self, request):

        total = (
            Expense.objects.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        recent = list(
            Expense.objects.values(
                "title",
                "amount",
                "expense_date",
                "category__name",
            )[:10]
        )

        return Response({
            "total_expenses": total,
            "recent_expenses": recent,
        })