from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views.auth import (
    LoginView,
    SignupView,
)
from apps.accounts.views.users import (
    PendingUsersView,
    ApproveUserView,
)
urlpatterns = [
    path("login/", LoginView.as_view()),
    path("signup/", SignupView.as_view()),
    path(
        "users/pending/",
        PendingUsersView.as_view()
    ),

    path(
        "users/<uuid:user_id>/approve/",
        ApproveUserView.as_view()
    ),
    path("login/", LoginView.as_view()),
    path("signup/", SignupView.as_view()),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
]