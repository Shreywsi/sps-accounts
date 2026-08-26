from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.fees.views.simple_payment import SimplePaymentViewSet
from apps.fees.views.financial_dashboard import FinancialDashboardAPIView
from apps.fees.views.monthly_fee_record import MonthlyFeeRecordViewSet
from apps.fees.views.payment_adjustment import PaymentAdjustmentViewSet

router = DefaultRouter()
router.register("simple-payments", SimplePaymentViewSet, basename="simple-payments")
router.register("ledger", MonthlyFeeRecordViewSet, basename="ledger")
router.register("adjustments", PaymentAdjustmentViewSet, basename="adjustments")

urlpatterns = [
    path("dashboard/", FinancialDashboardAPIView.as_view(), name="financial-dashboard"),
]

urlpatterns += router.urls