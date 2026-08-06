from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.fees.views import (
    DashboardAPIView,
    CollectionReportAPIView,
    OutstandingReportAPIView,
    FeeAssignmentViewSet,
    FeeCategoryViewSet,
    FeeStructureItemViewSet,
    FeeStructureViewSet,
    PaymentViewSet,
)

router = DefaultRouter()

router.register(
    "categories",
    FeeCategoryViewSet,
)

router.register(
    "structures",
    FeeStructureViewSet,
)

router.register(
    "structure-items",
    FeeStructureItemViewSet,
)

router.register(
    "student-fees",
    FeeAssignmentViewSet,
)

router.register(
    "payments",
    PaymentViewSet,
)

urlpatterns = [
    path(
        "dashboard/",
        DashboardAPIView.as_view(),
        name="fees-dashboard",
    ),
    path(
        "reports/collections/",
        CollectionReportAPIView.as_view(),
        name="collection-report",
    ),
    path(
        "reports/outstanding/",
        OutstandingReportAPIView.as_view(),
        name="outstanding-report",
    ),
]

urlpatterns += router.urls

