from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import RolePermission, LockedAfterApproval
from apps.common.mixins import ActivityLoggingMixin
from apps.transactions.models import Transaction, TransactionCategory, TransactionColumn
from apps.transactions.serializers.transaction import (
    TransactionCategorySerializer,
    TransactionColumnSerializer,
    TransactionSerializer,
)


class TransactionViewSet(ActivityLoggingMixin, viewsets.ModelViewSet):
    """
    Operator: list/create/update their own rows (the Excel-style sheet).
    Filter by ?status=SUBMITTED&transaction_date=YYYY-MM-DD etc.
    Admin: same list endpoint (unfiltered by owner) plus approve/reject.

    Write access to an already-APPROVED row is blocked twice:
      1. LockedAfterApproval -> rejects the request at the API layer.
      2. Transaction.save()  -> rejects the write at the model layer,
         so the guarantee holds even for code paths that don't go
         through this viewset (admin shell, management commands, etc).
    """

    serializer_class = TransactionSerializer
    permission_classes = [RolePermission, LockedAfterApproval]
    roles_required = {
        "PATCH": ("ADMIN", "OPERATOR"),
        "PUT": ("ADMIN", "OPERATOR"),
        "DELETE": ("ADMIN",),
    }

    activity_target_model = "Transaction"
    activity_watched_fields = (
        "total_amount", "status", "transaction_date",
        "transaction_type", "category_id", "narration",
    )
    activity_action_map = {
        "create": "CREATE_TRANSACTION",
        "update": "UPDATE_TRANSACTION",
        "partial_update": "UPDATE_TRANSACTION",
        "destroy": "DELETE_TRANSACTION",
        "approve": "APPROVE_TRANSACTION",
        "reject": "REJECT_TRANSACTION",
    }

    def _describe(self, instance):
        return f"{instance.transaction_type} #{instance.pk} ({instance.total_amount})"

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

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[RolePermission],
        url_path="approve",
    )
    def approve(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = Transaction.Status.APPROVED
        transaction.approved_by = request.user
        transaction.approved_at = timezone.now()
        transaction.save()
        self.log_custom_action("approve", transaction)
        return Response(TransactionSerializer(transaction).data)

    approve.roles_required = ("ADMIN",)

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[RolePermission],
        url_path="reject",
    )
    def reject(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = Transaction.Status.REJECTED
        transaction.approved_by = request.user
        transaction.approved_at = timezone.now()
        transaction.save()
        self.log_custom_action("reject", transaction)
        return Response(TransactionSerializer(transaction).data)

    reject.roles_required = ("ADMIN",)


class TransactionCategoryViewSet(ActivityLoggingMixin, viewsets.ModelViewSet):
    """
    Flexible category list operators use in the row dropdown. GET/POST
    open to any authenticated user; PATCH/DELETE admin-only.
    """

    serializer_class = TransactionCategorySerializer
    permission_classes = [RolePermission]
    roles_required = {
        "PATCH": ("ADMIN",),
        "PUT": ("ADMIN",),
        "DELETE": ("ADMIN",),
    }
    activity_target_model = "TransactionCategory"
    activity_action_map = {
        "create": "CREATE_TRANSACTION_CATEGORY",
        "destroy": "DELETE_TRANSACTION_CATEGORY",
    }

    def get_queryset(self):
        qs = TransactionCategory.objects.all()
        if self.request.query_params.get("is_active") == "true":
            qs = qs.filter(is_active=True)
        return qs


class TransactionColumnViewSet(ActivityLoggingMixin, viewsets.ModelViewSet):
    serializer_class = TransactionColumnSerializer
    permission_classes = [RolePermission]
    roles_required = {
        "PATCH": ("ADMIN",),
        "PUT": ("ADMIN",),
        "DELETE": ("ADMIN",),
    }
    activity_target_model = "TransactionColumn"
    activity_action_map = {
        "create": "CREATE_TRANSACTION_COLUMN",
        "destroy": "DELETE_TRANSACTION_COLUMN",
    }

    def get_queryset(self):
        qs = TransactionColumn.objects.all()
        if self.request.query_params.get("is_active") == "true":
            qs = qs.filter(is_active=True)
        return qs
