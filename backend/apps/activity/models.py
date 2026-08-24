import uuid
from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Track all operator actions for admin review"""
    
    class ActionType(models.TextChoices):
        CREATE_STUDENT = "CREATE_STUDENT", "Create Student"
        UPDATE_STUDENT = "UPDATE_STUDENT", "Update Student"
        DELETE_STUDENT = "DELETE_STUDENT", "Delete Student"
        VERIFY_STUDENT = "VERIFY_STUDENT", "Verify Student"
        REJECT_STUDENT = "REJECT_STUDENT", "Reject Student"
        REOPEN_STUDENT = "REOPEN_STUDENT", "Reopen Student"
        CREATE_EVENT = "CREATE_EVENT", "Create Event"
        UPDATE_EVENT = "UPDATE_EVENT", "Update Event"
        DELETE_EVENT = "DELETE_EVENT", "Delete Event"
        SUBMIT_EVENT = "SUBMIT_EVENT", "Submit Event"
        APPROVE_EVENT = "APPROVE_EVENT", "Approve Event"
        REJECT_EVENT = "REJECT_EVENT", "Reject Event"
        CREATE_EXPENSE = "CREATE_EXPENSE", "Create Expense"
        UPDATE_EXPENSE = "UPDATE_EXPENSE", "Update Expense"
        DELETE_EXPENSE = "DELETE_EXPENSE", "Delete Expense"
        CREATE_TRANSACTION = "CREATE_TRANSACTION", "Create Transaction"
        UPDATE_TRANSACTION = "UPDATE_TRANSACTION", "Update Transaction"
        DELETE_TRANSACTION = "DELETE_TRANSACTION", "Delete Transaction"
        APPROVE_TRANSACTION = "APPROVE_TRANSACTION", "Approve Transaction"
        REJECT_TRANSACTION = "REJECT_TRANSACTION", "Reject Transaction"
        CREATE_TRANSACTION_CATEGORY = "CREATE_TRANSACTION_CATEGORY", "Create Transaction Category"
        DELETE_TRANSACTION_CATEGORY = "DELETE_TRANSACTION_CATEGORY", "Delete Transaction Category"
        CREATE_TRANSACTION_COLUMN = "CREATE_TRANSACTION_COLUMN", "Create Transaction Column"
        DELETE_TRANSACTION_COLUMN = "DELETE_TRANSACTION_COLUMN", "Delete Transaction Column"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    action_type = models.CharField(
        max_length=50,
        choices=ActionType.choices,
    )

    description = models.TextField(
        help_text="Human-readable description of the action",
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="activities",
    )

    actor_role = models.CharField(
        max_length=20,
        help_text="Store the role at time of action",
    )

    target_model = models.CharField(
        max_length=100,
        help_text="Model name that was affected (e.g., 'Student', 'Event')",
    )

    target_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="ID of the affected object",
    )

    target_description = models.CharField(
        max_length=255,
        blank=True,
        help_text="Human-readable description of affected object",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context about the action",
    )

    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["actor"]),
            models.Index(fields=["action_type"]),
        ]

    def __str__(self):
        return f"{self.actor_role} - {self.action_type} - {self.timestamp}"