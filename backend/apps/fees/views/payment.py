from rest_framework import status
from rest_framework.response import Response
from rest_framework import viewsets

from apps.fees.models import Payment
from apps.fees.serializers import PaymentSerializer
from apps.fees.services import PaymentService


class PaymentViewSet(viewsets.ModelViewSet):

    queryset = (
        Payment.objects
        .select_related(
            "student_fee",
            "received_by",
        )
    )

    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data

        payment = PaymentService.collect_payment(
            student_fee=data["student_fee"],
            amount=data["amount"],
            payment_method=data["payment_method"],
            transaction_reference=data.get(
                "transaction_reference",
                "",
            ),
            remarks=data.get(
                "remarks",
                "",
            ),
            received_by=self.request.user,
        )

        serializer.instance = payment