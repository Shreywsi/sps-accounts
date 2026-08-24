import uuid

from django.conf import settings
from django.db import models
from apps.students.models import Student


class TransactionCategory(models.Model):
    """
    Operator-managed category list (the 'add/remove like Excel columns'
    piece). Any role can create one on the fly while entering a row;
    only ADMIN can deactivate/delete — enforced in permissions.py, not
    here, so the model stays a plain lookup table.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_transaction_categories",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Transaction categories"

    def __str__(self):
        return self.name


class TransactionColumn(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_transaction_columns",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Transaction(models.Model):

    class TransactionType(models.TextChoices):
        FEE = "FEE", "Student Fee"
        INCOME = "INCOME", "Income"
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
    category = models.ForeignKey(
        TransactionCategory,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="transactions",
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

    custom_data = models.JSONField(
        default=dict,
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

    # Fields that must never change once a transaction is APPROVED,
    # even by an admin acting through anything other than a deliberate
    # re-open action. This is the layer that holds even if a permission
    # check is missing on some future endpoint.
    LOCKED_FIELDS = (
        "total_amount",
        "transaction_type",
        "transaction_date",
        "student",
        "category",
    )

    def save(self, *args, **kwargs):
        if self.pk:
            original = Transaction.objects.filter(pk=self.pk).first()
            if original and original.status == self.Status.APPROVED:
                for field in self.LOCKED_FIELDS:
                    if getattr(original, field) != getattr(self, field):
                        raise ValueError(
                            f"Cannot modify '{field}' on an APPROVED transaction. "
                            f"Reopen it first via an explicit admin action."
                        )
        super().save(*args, **kwargs)

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