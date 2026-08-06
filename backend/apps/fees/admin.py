from django.contrib import admin

from apps.fees.models import (
    FeeCategory,
    FeeStructure,
    FeeStructureItem,
    Payment,
    StudentFee,
)

admin.site.register(FeeCategory)
admin.site.register(FeeStructure)
admin.site.register(FeeStructureItem)
admin.site.register(StudentFee)
admin.site.register(Payment)