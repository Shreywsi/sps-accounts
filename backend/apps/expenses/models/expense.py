from django.conf import settings
from django.db import models

from apps.expenses.models.expense_category import ExpenseCategory


class Expense(models.Model):
    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
        ("bank", "Bank Transfer"),
        ("cheque", "Cheque"),
    ]

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT,
        related_name="expenses",
    )

    title = models.CharField(
        max_length=200,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="cash",
    )

    expense_date = models.DateField()

    remarks = models.TextField(
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-expense_date", "-created_at"]

    def __str__(self):
        return self.title