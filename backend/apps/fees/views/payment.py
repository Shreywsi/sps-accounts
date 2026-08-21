from rest_framework import viewsets

from apps.fees.models import Payment
from apps.fees.serializers import PaymentSerializer
from apps.fees.services import PaymentService
from apps.notifications.utils import notify_admins


class PaymentViewSet(viewsets.ModelViewSet):

    queryset = (
        Payment.objects
        .select_related("student_fee", "received_by")
    )

    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data

        payment = PaymentService.collect_payment(
            student_fee=data["student_fee"],
            amount=data["amount"],
            payment_method=data["payment_method"],
            transaction_reference=data.get("transaction_reference", ""),
            remarks=data.get("remarks", ""),
            received_by=self.request.user,
        )

        serializer.instance = payment

        notify_admins(
            actor=self.request.user,
            category="PAYMENT",
            title="Fee payment collected",
            message=(
                f"{self.request.user.username} collected ₹{payment.amount} "
                f"from {payment.student_fee.student}."
            ),
            link="/fees/collect",
        )