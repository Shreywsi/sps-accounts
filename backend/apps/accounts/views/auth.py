from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.serializers.auth import (
    LoginSerializer,
    SignupSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]


        if user.account_status != "APPROVED":
            return Response(
                {
                    "message": f"Account is {user.account_status.lower()}. Please contact admin."
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        serializer = SignupSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response(
            {
                "message": "Registration successful. Wait for admin approval.",
                "user": {
                    "username": user.username,
                    "role": user.role,
                    "account_status": user.account_status,
                },
            },
            status=status.HTTP_201_CREATED,
        )