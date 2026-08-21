from rest_framework.routers import DefaultRouter

from apps.transactions.views.transaction import (
    TransactionCategoryViewSet,
    TransactionColumnViewSet,
    TransactionViewSet,
)

router = DefaultRouter()
router.register("categories", TransactionCategoryViewSet, basename="transaction-categories")
router.register("columns", TransactionColumnViewSet, basename="transaction-columns")
router.register("", TransactionViewSet, basename="transactions")

urlpatterns = router.urls