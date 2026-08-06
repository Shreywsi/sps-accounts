from django.db import models

from apps.fees.models.fee_category import FeeCategory
from apps.fees.models.fee_structure import FeeStructure


class FeeStructureItem(models.Model):
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name="items",
    )

    fee_category = models.ForeignKey(
        FeeCategory,
        on_delete=models.PROTECT,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    class Meta:
        unique_together = (
            "fee_structure",
            "fee_category",
        )

    def __str__(self):
        return (
            f"{self.fee_structure} - "
            f"{self.fee_category}"
        )