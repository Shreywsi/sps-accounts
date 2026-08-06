import uuid

from django.conf import settings
from django.db import models
from apps.students.models import Student

class Transaction(models.Model):

    class TransactionType(models.TextChoices):
        FEE = "FEE", "Student Fee"
        EXPENSE = "EXPENSE", "Expense"
        SALARY = "SALARY", "Salary"
        LOAN = "LOAN", "Loan"
        BANK = "BANK", "Bank"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    class PaymentMode(models.TextChoices):
        CASH = "CASH", "Cash"
        BANK = "BANK", "Bank"
        UPI = "UPI", "UPI"
        CHEQUE = "CHEQUE", "Cheque"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="transactions",
    )
    transaction_date = models.DateField()

    payment_mode = models.CharField(
        max_length=20,
        choices=PaymentMode.choices,
        default=PaymentMode.CASH,
    )

    narration = models.TextField(
        blank=True,
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_transactions",
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="approved_transactions",
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.transaction_type} - {self.total_amount}"

class TransactionItem(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name="items",
    )

    title = models.CharField(
        max_length=200,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    remarks = models.CharField(
        max_length=255,
        blank=True,
    )

    def __str__(self):
        return self.title