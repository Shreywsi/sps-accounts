from django.conf import settings
from django.db import models


class PaymentAdjustment(models.Model):
    """
    The ONLY way to change the effect of an already-approved SimplePayment.
    Approved payments are immutable (enforced in the viewset) so the
    financial trail always shows what actually happened, in order. Need to
    fix a typo'd amount, issue a refund, or correct a misapplied payment?
    Create an adjustment - never edit the original row.

    A positive adjustment_amount adds to the linked MonthlyFeeRecord's
    amount_paid (e.g. "operator under-recorded by 500"). A negative amount
    subtracts (e.g. refund, overpayment correction).
    """

    original_payment = models.ForeignKey(
        "fees.SimplePayment",
        on_delete=models.PROTECT,
        related_name="adjustments",
    )

    adjustment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Positive to add, negative to subtract from the linked month's amount_paid",
    )

    reason = models.TextField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payment_adjustments",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Adjustment on {self.original_payment.receipt_number}: {self.adjustment_amount}"