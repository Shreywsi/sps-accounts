from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.serializers.user import PendingUserSerializer


class PendingUsersView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        users = User.objects.filter(
            account_status="PENDING"
        )

        serializer = PendingUserSerializer(
            users,
            many=True
        )

        return Response(serializer.data)

class ApproveUserView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):

        try:
            user = User.objects.get(id=user_id)

        except User.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.account_status = "APPROVED"
        user.save()

        return Response(
            {
                "message": "User approved successfully.",
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )