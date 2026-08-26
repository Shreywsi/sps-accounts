from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/v1/auth/",
        include("apps.accounts.urls"),
    ),

    path(
        "api/v1/",
        include("apps.students.urls"),
    ),

    path(
        "api/v1/academics/",
        include("apps.academics.urls"),
    ),

    path(
        "api/v1/fees/",
        include("apps.fees.simple_urls"),
    ),
    path(
        "api/v1/fees/",
        include("apps.fees.fee_structure_urls"),
    ),
    path(
        "api/v1/fees/",
        include("apps.fees.urls"),
    ),
    path(
        "api/v1/expenses/",
        include("apps.expenses.urls"),
    ),
    path(
        "api/v1/transactions/",
        include("apps.transactions.urls"),
    ),
        path(
        "api/v1/",
        include("apps.notifications.urls"),
    ),
    path(
        "api/v1/events/",
        include("apps.events.urls"),
    ),
    path(
        "api/v1/",
        include("apps.activity.urls"),
    ),
]