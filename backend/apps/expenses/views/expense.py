from django.db.models import Sum
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear
from django.utils import timezone
from datetime import timedelta

from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.models import Expense
from apps.expenses.serializers import ExpenseSerializer
from apps.notifications.utils import notify_admins


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related(
        "category",
        "created_by",
    )
    serializer_class = ExpenseSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["category", "payment_method", "created_by", "expense_date"]

    def perform_create(self, serializer):
        expense = serializer.save()

        notify_admins(
            actor=self.request.user,
            category="EXPENSE",
            title="New expense recorded",
            message=(
                f"{self.request.user.username} added an expense of "
                f"₹{expense.amount} for '{expense.title}'."
            ),
            link="/expenses/reports",
        )


class ExpenseDashboardAPIView(APIView):

    def get(self, request):

        total = (
            Expense.objects.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        recent = list(
            Expense.objects.values(
                "id",
                "title",
                "amount",
                "expense_date",
                "category__name",
                "created_by__username",
            )[:10]
        )

        return Response({
            "total_expenses": total,
            "recent_expenses": recent,
        })


class ExpenseSummaryAPIView(APIView):
    """Weekly / monthly / annual expense summary for the admin dashboard."""

    def get(self, request):
        today = timezone.now().date()
        period = request.GET.get("period", "monthly")

        if period == "weekly":
            start = today - timedelta(days=today.weekday())
            trunc = TruncWeek("expense_date")
        elif period == "annual":
            start = today.replace(month=1, day=1)
            trunc = TruncYear("expense_date")
        else:
            period = "monthly"
            start = today.replace(day=1)
            trunc = TruncMonth("expense_date")

        current_period_qs = Expense.objects.filter(expense_date__gte=start)

        total = current_period_qs.aggregate(total=Sum("amount"))["total"] or 0

        by_category = list(
            current_period_qs.values("category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        # Trend across all history, bucketed by the chosen granularity
        trend = list(
            Expense.objects.annotate(bucket=trunc)
            .values("bucket")
            .annotate(total=Sum("amount"))
            .order_by("bucket")
        )

        return Response({
            "period": period,
            "start_date": start,
            "total": total,
            "by_category": by_category,
            "trend": trend,
        })