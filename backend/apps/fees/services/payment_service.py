from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.fees.models import Payment


class PaymentService:

    @staticmethod
    def generate_receipt_number():
        today = timezone.now().strftime("%Y%m%d")

        last_payment = (
            Payment.objects
            .filter(receipt_number__startswith=f"RCPT-{today}")
            .order_by("-receipt_number")
            .first()
        )

        if not last_payment:
            sequence = 1
        else:
            sequence = int(last_payment.receipt_number.split("-")[-1]) + 1

        return f"RCPT-{today}-{sequence:06d}"

    @staticmethod
    @transaction.atomic
    def collect_payment(
        *,
        student_fee,
        amount,
        payment_method,
        received_by,
        transaction_reference="",
        remarks="",
    ):
        amount = Decimal(str(amount))

        if amount <= 0:
            raise ValueError("Amount must be greater than zero.")

        student_fee.refresh_from_db()

        if amount > student_fee.balance:
            raise ValueError("Payment exceeds outstanding balance.")

        payment = Payment.objects.create(
            student_fee=student_fee,
            receipt_number=PaymentService.generate_receipt_number(),
            amount=amount,
            payment_method=payment_method,
            received_by=received_by,
            transaction_reference=transaction_reference,
            remarks=remarks,
            status="SUCCESS",
        )

        student_fee.amount_paid += amount
        student_fee.save()

        return payment