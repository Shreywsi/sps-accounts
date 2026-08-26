from decimal import Decimal

from rest_framework import mixins, viewsets
from django_filters.rest_framework import DjangoFilterBackend

from apps.fees.models.payment_adjustment import PaymentAdjustment
from apps.fees.serializers.payment_adjustment import PaymentAdjustmentSerializer
from apps.students.permissions import IsAdminRole
from apps.activity.services import log_activity


class PaymentAdjustmentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Admin-only, create + read only - no update, no delete. An adjustment
    is itself part of the permanent trail, so correcting a correction
    means creating another adjustment, not editing this one.
    """

    queryset = PaymentAdjustment.objects.select_related("original_payment", "created_by")
    serializer_class = PaymentAdjustmentSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["original_payment"]

    def perform_create(self, serializer):
        adjustment = serializer.save(created_by=self.request.user)

        payment = adjustment.original_payment
        record = payment.monthly_fee_record
        if record is not None:
            record.amount_paid += Decimal(str(adjustment.adjustment_amount))
            record.recalculate()

        log_activity(
            actor=self.request.user,
            action_type="ADJUST_PAYMENT",
            description=(
                f"Adjustment on {payment.receipt_number}: "
                f"{adjustment.adjustment_amount} ({adjustment.reason})"
            ),
            target_model="PaymentAdjustment",
            target_id=adjustment.id,
            target_description=str(adjustment),
            request=self.request,
        )