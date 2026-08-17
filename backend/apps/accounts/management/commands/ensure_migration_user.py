import os
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User


class Command(BaseCommand):
    help = (
        "Ensures a specific user (identified by a fixed UUID) exists in the "
        "database, matching the local user referenced by migrated data fixtures. "
        "Reads all values from environment variables. Safe to run multiple times."
    )

    def handle(self, *args, **options):
        user_id = os.environ.get("MIGRATION_USER_ID")
        username = os.environ.get("MIGRATION_USER_USERNAME")
        password = os.environ.get("MIGRATION_USER_PASSWORD")
        email = os.environ.get("MIGRATION_USER_EMAIL", "")

        if not user_id or not username or not password:
            raise CommandError(
                "MIGRATION_USER_ID, MIGRATION_USER_USERNAME, and "
                "MIGRATION_USER_PASSWORD environment variables are required."
            )

        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise CommandError("MIGRATION_USER_ID is not a valid UUID.")

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                id=user_uuid,
                defaults={
                    "username": username,
                    "email": email,
                },
            )

            user.username = username
            user.email = email
            user.role = User.Role.ADMIN
            user.account_status = User.AccountStatus.APPROVED
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(password)
            user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} migration user '{username}' ({user_uuid})")
        )