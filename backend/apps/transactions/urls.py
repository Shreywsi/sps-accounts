from django.urls import path

from apps.transactions.views.transaction import (
    TransactionCreateView,
)

urlpatterns = [
    path(
        "",
        TransactionCreateView.as_view(),
    ),
]