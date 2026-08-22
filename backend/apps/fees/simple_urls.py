from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.fees.views.simple_payment import SimplePaymentViewSet
from apps.fees.views.financial_dashboard import FinancialDashboardAPIView

router = DefaultRouter()
router.register("simple-payments", SimplePaymentViewSet, basename="simple-payments")

urlpatterns = [
    path("dashboard/", FinancialDashboardAPIView.as_view(), name="financial-dashboard"),
]

urlpatterns += router.urls