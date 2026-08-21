from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.transactions.models import Transaction, TransactionCategory, TransactionColumn
from apps.transactions.permissions import (
    IsAdminRole,
    IsAuthenticatedColumnManager,
)
from apps.transactions.serializers.transaction import (
    TransactionCategorySerializer,
    TransactionColumnSerializer,
    TransactionSerializer,
)


class TransactionViewSet(viewsets.ModelViewSet):
    """
    Operator: list/create/update their own rows (the Excel-style sheet).
    Filter by ?status=SUBMITTED&transaction_date=YYYY-MM-DD etc.
    Admin: same list endpoint (unfiltered by owner) plus approve/reject.
    """

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.all().select_related(
            "category", "created_by", "approved_by", "student"
        ).prefetch_related("items")

        user = self.request.user
        if user.role != "ADMIN":
            qs = qs.filter(created_by=user)

        params = self.request.query_params
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("transaction_date"):
            qs = qs.filter(transaction_date=params["transaction_date"])
        if params.get("transaction_type"):
            qs = qs.filter(transaction_type=params["transaction_type"])

        return qs

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminRole])
    def approve(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = Transaction.Status.APPROVED
        transaction.approved_by = request.user
        transaction.approved_at = timezone.now()
        transaction.save()
        return Response(TransactionSerializer(transaction).data)

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminRole])
    def reject(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = Transaction.Status.REJECTED
        transaction.approved_by = request.user
        transaction.approved_at = timezone.now()
        transaction.save()
        return Response(TransactionSerializer(transaction).data)


class TransactionCategoryViewSet(viewsets.ModelViewSet):
    """
    Flexible category list operators use in the row dropdown. GET/POST
    open to any authenticated user; PATCH/DELETE admin-only.
    """

    serializer_class = TransactionCategorySerializer
    permission_classes = [IsAuthenticatedColumnManager]

    def get_queryset(self):
        qs = TransactionCategory.objects.all()
        if self.request.query_params.get("is_active") == "true":
            qs = qs.filter(is_active=True)
        return qs


class TransactionColumnViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionColumnSerializer
    permission_classes = [IsAuthenticatedColumnManager]

    def get_queryset(self):
        qs = TransactionColumn.objects.all()
        if self.request.query_params.get("is_active") == "true":
            qs = qs.filter(is_active=True)
        return qs