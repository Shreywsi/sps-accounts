"""
Adds the "I-V" and "VI-VII" Day Scholar fee groups so Day Scholar mirrors
the same class-range split that Hostel already uses.

Most sessions already have an "I-V ..." Day Scholar group (nothing to do
there), but Day Scholar classes VI & VII have historically been lumped
into a single "VI-VIII ..." group instead of getting their own "VI-VII"
group like Hostel has. This command, for every session that has a Day
Scholar group covering VI-VIII (or similar) but no dedicated VI-VII group:

  1. Creates a new "<same name pattern> VI-VII Day Scholar" group, copying
     every fee head from the existing VI-VIII group (same labels,
     frequencies and amounts) so nothing is billed as Rs. 0 by accident.
     An admin/operator can now edit those amounts from the Fee Structure
     page (Edit button on the group, or per fee-head Edit).
  2. Re-points the ClassFeeMapping.day_scholar_group for classes "VI" and
     "VII" to the new group. Class "VIII" is left on the original group.

Safe to run more than once - it skips any session that already has a
Day Scholar group whose applicable_class_range is exactly "VI-VII".

Usage:
    python manage.py add_dayscholar_class_ranges
    python manage.py add_dayscholar_class_ranges --session-id 5
    python manage.py add_dayscholar_class_ranges --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.fees.models import FeeSession, FeeCategoryGroup, FeeHead, ClassFeeMapping


class Command(BaseCommand):
    help = (
        "Adds a dedicated 'VI-VII' Day Scholar fee group (mirroring Hostel) "
        "for sessions that currently only have a combined VI-VIII group."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--session-id",
            type=int,
            default=None,
            help="Only run for this FeeSession id (default: all sessions).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without writing anything.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        sessions = FeeSession.objects.all()
        if options["session_id"]:
            sessions = sessions.filter(id=options["session_id"])

        if not sessions.exists():
            self.stdout.write(self.style.WARNING("No matching fee sessions found."))
            return

        for session in sessions:
            self._handle_session(session, dry_run)

    def _handle_session(self, session, dry_run):
        day_groups = FeeCategoryGroup.objects.filter(
            session=session, boarding_type="day_scholar"
        )

        already_has_vi_vii = day_groups.filter(
            applicable_class_range__iexact="VI-VII"
        ).exists()
        if already_has_vi_vii:
            self.stdout.write(
                f"[{session.session_label}] already has a Day Scholar "
                "'VI-VII' group - skipping."
            )
            return

        # Find the combined group covering VI (and usually VII/VIII) -
        # look for a range like "VI-VIII", "VI-VII", "VI-XII", etc.
        source_group = None
        for group in day_groups:
            rng = (group.applicable_class_range or "").upper().replace(" ", "")
            if rng.startswith("VI-"):
                source_group = group
                break

        if not source_group:
            self.stdout.write(
                self.style.WARNING(
                    f"[{session.session_label}] no existing 'VI-...' Day "
                    "Scholar group found to copy from - skipping. Add a "
                    "'VI-VII' group manually from the Fee Structure page."
                )
            )
            return

        source_heads = list(source_group.fee_heads.all())

        self.stdout.write(
            f"[{session.session_label}] would create Day Scholar 'VI-VII' "
            f"group by copying {len(source_heads)} fee head(s) from "
            f"'{source_group.name}', and re-point classes VI & VII to it."
        )

        if dry_run:
            return

        with transaction.atomic():
            new_name = source_group.name.replace(
                source_group.applicable_class_range, "VI-VII"
            )
            if new_name == source_group.name:
                new_name = "VI-VII Day Scholar"

            new_group, created = FeeCategoryGroup.objects.get_or_create(
                session=session,
                name=new_name,
                boarding_type="day_scholar",
                defaults={
                    "applicable_class_range": "VI-VII",
                    "display_order": source_group.display_order,
                },
            )

            if created:
                for head in source_heads:
                    FeeHead.objects.get_or_create(
                        group=new_group,
                        label=head.label,
                        frequency=head.frequency,
                        defaults={
                            "amount": head.amount,
                            "is_mandatory": head.is_mandatory,
                            "display_order": head.display_order,
                            "editable_by": head.editable_by,
                            "notes": head.notes,
                            "is_active": head.is_active,
                        },
                    )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[{session.session_label}] created '{new_group.name}' "
                        f"with {len(source_heads)} fee head(s)."
                    )
                )
            else:
                self.stdout.write(
                    f"[{session.session_label}] group '{new_group.name}' "
                    "already existed - reusing it."
                )

            updated = ClassFeeMapping.objects.filter(
                session=session, class_name__in=["VI", "VII"]
            ).update(day_scholar_group=new_group)
            self.stdout.write(
                f"[{session.session_label}] re-pointed {updated} class "
                "mapping(s) (VI, VII) to the new Day Scholar group."
            )

        self.stdout.write(
            self.style.SUCCESS(f"[{session.session_label}] done.")
        )