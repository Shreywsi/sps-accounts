from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
import cloudinary.uploader
import logging

from apps.fees.models.simple_payment import SimplePayment
from apps.fees.serializers.simple_payment_serializer import SimplePaymentSerializer
from apps.students.permissions import IsAdminOrOperator, IsAdminRole
from apps.activity.services import log_activity

logger = logging.getLogger(__name__)


class SimplePaymentViewSet(viewsets.ModelViewSet):
    queryset = SimplePayment.objects.select_related('student', 'monthly_fee_record').all()
    serializer_class = SimplePaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["student", "payment_type", "status", "payment_date", "monthly_fee_record"]

    def get_queryset(self):
        try:
            return super().get_queryset()
        except Exception as e:
            logger.exception("Error in get_queryset for SimplePayment")
            return SimplePayment.objects.all()

    def get_permissions(self):
        if self.action in ["approve", "reject"]:
            return [IsAdminRole()]
        return [IsAdminOrOperator()]

    def perform_create(self, serializer):
        # Generate receipt number server-side - operators never get to
        # choose it, so it can't be duplicated or spoofed to look like an
        # existing receipt.
        import uuid
        receipt_number = f"REC-{uuid.uuid4().hex[:8].upper()}"

        payment = serializer.save(receipt_number=receipt_number, received_by=self.request.user)

        log_activity(
            actor=self.request.user,
            action_type="CREATE_PAYMENT",
            description=f"Payment recorded: {payment.payment_type} - {payment.amount} for {payment.student.admission_no}",
            target_model="SimplePayment",
            target_id=payment.id,
            target_description=str(payment),
            request=self.request,
        )

    def perform_update(self, serializer):
        payment = self.get_object()
        # Approved payments are the permanent financial record. If it was
        # entered wrong, that's what PaymentAdjustment is for - never a
        # silent edit that would make the audit trail lie.
        if payment.is_locked:
            raise PermissionDenied(
                "Approved payments can't be edited. Create a payment adjustment instead."
            )
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_locked:
            raise PermissionDenied("Approved payments can't be deleted.")

        if instance.receipt:
            try:
                cloudinary.uploader.destroy(
                    instance.receipt.public_id,
                    invalidate=True,
                    resource_type=instance.receipt.resource_type,
                    type=instance.receipt.type,
                )
            except Exception:
                logger.exception("Failed to delete receipt from Cloudinary")

        log_activity(
            actor=self.request.user,
            action_type="DELETE_PAYMENT",
            description=f"Payment deleted: {instance.receipt_number} - {instance.amount}",
            target_model="SimplePayment",
            target_id=instance.id,
            target_description=str(instance),
            request=self.request,
        )

        instance.delete()

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        payment = self.get_object()

        if payment.status == "APPROVED":
            return Response({"message": "Payment already approved"})

        # Separation of duties: whoever recorded the payment can't also be
        # the one who signs off on it. Enforced server-side so it can't be
        # bypassed by calling the API directly.
        if payment.received_by_id == request.user.id:
            raise PermissionDenied("You can't approve a payment you recorded yourself.")

        payment.status = "APPROVED"
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save()

        from decimal import Decimal
        student = payment.student

        if payment.payment_type == "ANNUAL":
            student.annual_fee_paid = True
        else:
            student.total_fee_paid += Decimal(str(payment.amount))
            student.last_payment_date = payment.payment_date

        student.update_fee_status()
        student.save(update_fields=["total_fee_paid", "last_payment_date", "fee_status", "annual_fee_paid", "updated_at"])

        # This is the actual month-by-month ledger update - approving a
        # MONTHLY payment is what moves that month from pending to paid.
        if payment.monthly_fee_record_id:
            record = payment.monthly_fee_record
            record.amount_paid += Decimal(str(payment.amount))
            record.recalculate()

        log_activity(
            actor=request.user,
            action_type="APPROVE_PAYMENT",
            description=f"Payment approved: {payment.receipt_number} - {payment.amount}",
            target_model="SimplePayment",
            target_id=payment.id,
            target_description=str(payment),
            request=request,
        )

        return Response({"message": "Payment approved successfully"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        payment = self.get_object()

        if payment.is_locked:
            raise ValidationError("Can't reject a payment that's already been approved.")

        reason = request.data.get("reason", "").strip()
        if not reason:
            raise ValidationError({"reason": "A rejection reason is required."})

        payment.status = "REJECTED"
        payment.rejection_reason = reason
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save()

        log_activity(
            actor=request.user,
            action_type="REJECT_PAYMENT",
            description=f"Payment rejected: {payment.receipt_number} - {payment.amount}. Reason: {reason}",
            target_model="SimplePayment",
            target_id=payment.id,
            target_description=str(payment),
            metadata={"rejection_reason": reason},
            request=request,
        )

        return Response({"message": "Payment rejected successfully"})