from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.expenses.views import (
    ExpenseCategoryViewSet,
    ExpenseDashboardAPIView,
    ExpenseSummaryAPIView,
    ExpenseViewSet,
)

router = DefaultRouter()

router.register(
    "categories",
    ExpenseCategoryViewSet,
)

router.register(
    "expenses",
    ExpenseViewSet,
)

urlpatterns = [
    path(
        "dashboard/",
        ExpenseDashboardAPIView.as_view(),
    ),
    path(
        "summary/",
        ExpenseSummaryAPIView.as_view(),
    ),
]

urlpatterns += router.urls