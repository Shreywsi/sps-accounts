"""
Seed script for fee structure data based on the provided fee sheets.
Run this with: python manage.py shell < apps/fees/seed_fee_structure.py
"""

from apps.fees.models import (
    FeeSession,
    FeeCategoryGroup,
    FeeHead,
    UniformFeeItem,
    ClassFeeMapping,
)


def seed_fee_structure():
    print("Seeding fee structure data...")

    # Create Sessions
    session_2022, _ = FeeSession.objects.get_or_create(
        session_label="2022-2023",
        defaults={
            "is_active": False,
            "start_date": "2022-04-01",
            "end_date": "2023-03-31"
        }
    )

    session_2026, _ = FeeSession.objects.get_or_create(
        session_label="2026-2027",
        defaults={
            "is_active": True,
            "start_date": "2026-04-01",
            "end_date": "2027-03-31"
        }
    )

    print(f"Created sessions: {session_2022.session_label}, {session_2026.session_label}")

    # === DAY SCHOLAR FEE STRUCTURE (2022-2023) ===

    # Pre-Nursery Day Scholar
    pre_nursery_group, _ = FeeCategoryGroup.objects.get_or_create(
        session=session_2022,
        name="Pre-Nursery Day Scholar",
        boarding_type="day_scholar",
        applicable_class_range="Pre-Nursery",
        defaults={"display_order": 1}
    )

    FeeHead.objects.get_or_create(
        group=pre_nursery_group,
        label="Registration",
        frequency="one_time",
        amount=300,
        defaults={"display_order": 1, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=pre_nursery_group,
        label="Admission (Non-refundable)",
        frequency="one_time",
        amount=7000,
        defaults={"display_order": 2, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=pre_nursery_group,
        label="Annual (Non-refundable)",
        frequency="yearly",
        amount=5650,
        defaults={"display_order": 3, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=pre_nursery_group,
        label="Monthly Tuition",
        frequency="monthly",
        amount=800,
        defaults={"display_order": 4, "is_mandatory": True}
    )

    # Nursery & KG Day Scholar
    nursery_kg_group, _ = FeeCategoryGroup.objects.get_or_create(
        session=session_2022,
        name="Nursery & KG Day Scholar",
        boarding_type="day_scholar",
        applicable_class_range="Nursery & KG",
        defaults={"display_order": 2}
    )

    FeeHead.objects.get_or_create(
        group=nursery_kg_group,
        label="Registration",
        frequency="one_time",
        amount=300,
        defaults={"display_order": 1, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=nursery_kg_group,
        label="Admission (Non-refundable)",
        frequency="one_time",
        amount=7000,
        defaults={"display_order": 2, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=nursery_kg_group,
        label="Annual (Non-refundable)",
        frequency="yearly",
        amount=5850,
        defaults={"display_order": 3, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=nursery_kg_group,
        label="Monthly Tuition",
        frequency="monthly",
        amount=900,
        defaults={"display_order": 4, "is_mandatory": True}
    )

    # I-V Day Scholar
    i_v_group, _ = FeeCategoryGroup.objects.get_or_create(
        session=session_2022,
        name="I-V Day Scholar",
        boarding_type="day_scholar",
        applicable_class_range="I-V",
        defaults={"display_order": 3}
    )

    FeeHead.objects.get_or_create(
        group=i_v_group,
        label="Registration",
        frequency="one_time",
        amount=300,
        defaults={"display_order": 1, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=i_v_group,
        label="Admission (Non-refundable)",
        frequency="one_time",
        amount=8000,
        defaults={"display_order": 2, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=i_v_group,
        label="Annual (Non-refundable)",
        frequency="yearly",
        amount=7850,
        defaults={"display_order": 3, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=i_v_group,
        label="Monthly Tuition",
        frequency="monthly",
        amount=1500,
        defaults={"display_order": 4, "is_mandatory": True}
    )

    # VI-VIII Day Scholar
    vi_viii_group, _ = FeeCategoryGroup.objects.get_or_create(
        session=session_2022,
        name="VI-VIII Day Scholar",
        boarding_type="day_scholar",
        applicable_class_range="VI-VIII",
        defaults={"display_order": 4}
    )

    FeeHead.objects.get_or_create(
        group=vi_viii_group,
        label="Registration",
        frequency="one_time",
        amount=300,
        defaults={"display_order": 1, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=vi_viii_group,
        label="Admission (Non-refundable)",
        frequency="one_time",
        amount=9000,
        defaults={"display_order": 2, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=vi_viii_group,
        label="Annual (Non-refundable)",
        frequency="yearly",
        amount=8850,
        defaults={"display_order": 3, "is_mandatory": True}
    )

    FeeHead.objects.get_or_create(
        group=vi_viii_group,
        label="Monthly Tuition",
        frequency="monthly",
        amount=1700,
        defaults={"display_order": 4, "is_mandatory": True}
    )

    print("Created Day Scholar fee groups and heads")

    # === HOSTEL FEE STRUCTURE (2026-2027) ===

    # I-V Hostel
    i_v_hostel_group, _ = FeeCategoryGroup.objects.get_or_create(
        session=session_2026,
        name="I-V Hostel",
        boarding_type="hostel",
        applicable_class_range="I-V",
        defaults={"display_order": 1}
    )

    hostel_heads_i_v = [
        ("Registration", "one_time", 300, 1),
        ("Admission (non-refundable)", "one_time", 8000, 2),
        ("Annual (non-refundable)", "yearly", 6650, 3),
        ("Tuition", "monthly", 1500, 4),
        ("Hostel/Accommodation", "monthly", 4000, 5),
        ("Fooding/Boarding", "monthly", 4500, 6),
        ("Electricity/Water/Maint.", "monthly", 500, 7),
        ("Uniform", "yearly", 3500, 8),
        ("Bed/Mattress/Bedding Kit", "one_time", 3150, 9),
        ("Wi-Fi", "yearly", 1200, 10),
        ("CCTV", "yearly", 1200, 11),
    ]

    for label, freq, amount, order in hostel_heads_i_v:
        FeeHead.objects.get_or_create(
            group=i_v_hostel_group,
            label=label,
            frequency=freq,
            amount=amount,
            defaults={"display_order": order, "is_mandatory": True}
        )

    # VI-VII Hostel
    vi_vii_hostel_group, _ = FeeCategoryGroup.objects.get_or_create(
        session=session_2026,
        name="VI-VII Hostel",
        boarding_type="hostel",
        applicable_class_range="VI-VII",
        defaults={"display_order": 2}
    )

    hostel_heads_vi_vii = [
        ("Registration", "one_time", 300, 1),
        ("Admission (non-refundable)", "one_time", 8000, 2),
        ("Annual (non-refundable)", "yearly", 5850, 3),
        ("Tuition", "monthly", 1700, 4),
        ("Hostel/Accommodation", "monthly", 5000, 5),
        ("Fooding/Boarding", "monthly", 5000, 6),
        ("Electricity/Water/Maint.", "monthly", 500, 7),
        ("Uniform", "yearly", 4300, 8),
        ("Bed/Mattress/Bedding Kit", "one_time", 5150, 9),
        ("Wi-Fi & CCTV", "yearly", 0, 10),  # Included
    ]

    for label, freq, amount, order in hostel_heads_vi_vii:
        FeeHead.objects.get_or_create(
            group=vi_vii_hostel_group,
            label=label,
            frequency=freq,
            amount=amount,
            defaults={"display_order": order, "is_mandatory": True}
        )

    print("Created Hostel fee groups and heads")

    # === UNIFORM ITEMS ===

    # Boys Uniform (2026-2027)
    boys_uniform_items = [
        ("Full Shirt", 450, 1),
        ("Full Pant", 650, 2),
        ("Half Shirt", 400, 3),
        ("Half Pant", 550, 4),
        ("Socks (2 sets)", 110, 5),
        ("Tie (1)", 110, 6),
        ("Belt (1)", 80, 7),
    ]

    for item_name, price, order in boys_uniform_items:
        UniformFeeItem.objects.get_or_create(
            session=session_2026,
            gender="boys",
            item_name=item_name,
            defaults={"price": price, "display_order": order}
        )

    # Girls Uniform (2026-2027)
    girls_uniform_items = [
        ("Full Shirt", 450, 1),
        ("Tunic", 650, 2),
        ("Half Shirt", 400, 3),
        ("Socks (2 sets)", 110, 4),
        ("Tie (1)", 110, 5),
        ("Belt (1)", 80, 6),
    ]

    for item_name, price, order in girls_uniform_items:
        UniformFeeItem.objects.get_or_create(
            session=session_2026,
            gender="girls",
            item_name=item_name,
            defaults={"price": price, "display_order": order}
        )

    print("Created uniform items")

    # === CLASS MAPPINGS ===

    # Map classes to fee groups (2022-2023 session)
    class_mappings_2022 = [
        ("Pre-Nursery", pre_nursery_group.id, None),
        ("Nursery", nursery_kg_group.id, None),
        ("KG", nursery_kg_group.id, None),
        ("I", i_v_group.id, None),
        ("II", i_v_group.id, None),
        ("III", i_v_group.id, None),
        ("IV", i_v_group.id, None),
        ("V", i_v_group.id, None),
        ("VI", vi_viii_group.id, None),
        ("VII", vi_viii_group.id, None),
        ("VIII", vi_viii_group.id, None),
    ]

    for class_name, day_group_id, hostel_group_id in class_mappings_2022:
        ClassFeeMapping.objects.get_or_create(
            session=session_2022,
            class_name=class_name,
            defaults={
                "day_scholar_group_id": day_group_id,
                "hostel_group_id": hostel_group_id,
                "default_uniform_gender_required": True
            }
        )

    # Map classes to fee groups (2026-2027 session)
    class_mappings_2026 = [
        ("Pre-Nursery", pre_nursery_group.id, None),
        ("Nursery", nursery_kg_group.id, None),
        ("KG", nursery_kg_group.id, None),
        ("I", i_v_hostel_group.id, i_v_group.id),
        ("II", i_v_hostel_group.id, i_v_group.id),
        ("III", i_v_hostel_group.id, i_v_group.id),
        ("IV", i_v_hostel_group.id, i_v_group.id),
        ("V", i_v_hostel_group.id, i_v_group.id),
        ("VI", vi_vii_hostel_group.id, vi_viii_group.id),
        ("VII", vi_vii_hostel_group.id, vi_viii_group.id),
        ("VIII", vi_vii_hostel_group.id, vi_viii_group.id),
    ]

    for class_name, day_group_id, hostel_group_id in class_mappings_2026:
        ClassFeeMapping.objects.get_or_create(
            session=session_2026,
            class_name=class_name,
            defaults={
                "day_scholar_group_id": day_group_id,
                "hostel_group_id": hostel_group_id,
                "default_uniform_gender_required": True
            }
        )

    print("Created class mappings")

    print("Fee structure seeding completed successfully!")


if __name__ == "__main__":
    seed_fee_structure()
