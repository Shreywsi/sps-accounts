from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.fees.views import (
    CollectionReportAPIView,
    DueFeesReportAPIView,
    OutstandingReportAPIView,
    FeeAssignmentViewSet,
    FeeCategoryViewSet,
    FeeStructureItemViewSet,
    FeeStructureViewSet,
    PaymentViewSet,
)

# NOTE: "dashboard/" and "simple-payments/" are intentionally NOT registered
# here - they're owned by apps.fees.simple_urls (FinancialDashboardAPIView /
# SimplePaymentViewSet), which is included alongside this module in
# config/urls.py. Registering them in both places would let whichever
# include() comes first silently shadow the other view.

router = DefaultRouter()

router.register("categories", FeeCategoryViewSet)
router.register("structures", FeeStructureViewSet)
router.register("structure-items", FeeStructureItemViewSet)
router.register("student-fees", FeeAssignmentViewSet)
router.register("payments", PaymentViewSet)

urlpatterns = [
    path("reports/collections/", CollectionReportAPIView.as_view(), name="collection-report"),
    path("reports/outstanding/", OutstandingReportAPIView.as_view(), name="outstanding-report"),
    path("reports/due-fees/", DueFeesReportAPIView.as_view(), name="due-fees-report"),
]

urlpatterns += router.urls