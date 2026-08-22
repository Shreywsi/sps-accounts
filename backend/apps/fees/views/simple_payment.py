from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
    queryset = SimplePayment.objects.all()
    serializer_class = SimplePaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["student", "payment_type", "status", "payment_date"]

    def get_permissions(self):
        if self.action in ["approve", "reject"]:
            return [IsAdminRole()]
        return [IsAdminOrOperator()]

    def perform_create(self, serializer):
        # Generate receipt number
        import uuid
        receipt_number = f"REC-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(receipt_number=receipt_number, received_by=self.request.user)
        
        # Log the activity
        payment = serializer.instance
        log_activity(
            actor=self.request.user,
            action_type="CREATE_PAYMENT",
            description=f"Payment recorded: {payment.payment_type} - {payment.amount} for {payment.student.admission_no}",
            target_model="SimplePayment",
            target_id=payment.id,
            target_description=str(payment),
            request=self.request,
        )

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        
        # Delete receipt from Cloudinary if exists
        if payment.receipt:
            try:
                cloudinary.uploader.destroy(
                    payment.receipt.public_id,
                    invalidate=True,
                    resource_type=payment.receipt.resource_type,
                    type=payment.receipt.type,
                )
            except Exception:
                logger.exception("Failed to delete receipt from Cloudinary")
        
        # Log the deletion
        log_activity(
            actor=request.user,
            action_type="DELETE_PAYMENT",
            description=f"Payment deleted: {payment.receipt_number} - {payment.amount}",
            target_model="SimplePayment",
            target_id=payment.id,
            target_description=str(payment),
            request=request,
        )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        payment = self.get_object()
        payment.status = "APPROVED"
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save()
        
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
        reason = request.data.get("reason", "").strip()
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