from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.fees.views import (
    DashboardAPIView,
    CollectionReportAPIView,
    DueFeesReportAPIView,
    OutstandingReportAPIView,
    FeeAssignmentViewSet,
    FeeCategoryViewSet,
    FeeStructureItemViewSet,
    FeeStructureViewSet,
    PaymentViewSet,
)
from apps.fees.views.simple_payment import SimplePaymentViewSet

router = DefaultRouter()

router.register("categories", FeeCategoryViewSet)
router.register("structures", FeeStructureViewSet)
router.register("structure-items", FeeStructureItemViewSet)
router.register("student-fees", FeeAssignmentViewSet)
router.register("payments", PaymentViewSet)
router.register("simple-payments", SimplePaymentViewSet, basename="simple-payments")

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="fees-dashboard"),
    path("reports/collections/", CollectionReportAPIView.as_view(), name="collection-report"),
    path("reports/outstanding/", OutstandingReportAPIView.as_view(), name="outstanding-report"),
    path("reports/due-fees/", DueFeesReportAPIView.as_view(), name="due-fees-report"),
]

urlpatterns += router.urls