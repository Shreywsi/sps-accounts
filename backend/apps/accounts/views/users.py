from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.students.permissions import IsAdminRole
from apps.accounts.serializers.user import PendingUserSerializer


class PendingUsersView(APIView):

    permission_classes = [IsAdminRole]

    def get(self, request):

        users = User.objects.filter(
            account_status="PENDING"
        )

        serializer = PendingUserSerializer(
            users,
            many=True
        )

        return Response(serializer.data)


class ApprovedUsersView(APIView):

    permission_classes = [IsAdminRole]

    def get(self, request):
        users = User.objects.filter(
            role=User.Role.OPERATOR,
            account_status=User.AccountStatus.APPROVED,
            is_active=True,
        )
        serializer = PendingUserSerializer(users, many=True)
        return Response(serializer.data)

class ApproveUserView(APIView):

    permission_classes = [IsAdminRole]

    def post(self, request, user_id):

        try:
            user = User.objects.get(id=user_id)

        except User.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.account_status = "APPROVED"
        user.is_active = True
        user.save()

        return Response(
            {
                "message": "User approved successfully.",
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )


class RevokeUserView(APIView):

    permission_classes = [IsAdminRole]

    def post(self, request, user_id):
        try:
            user = User.objects.get(
                id=user_id,
                role=User.Role.OPERATOR,
            )
        except User.DoesNotExist:
            return Response(
                {"message": "Operator not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.account_status = User.AccountStatus.REJECTED
        user.is_active = False
        user.save(update_fields=["account_status", "is_active", "updated_at"])

        return Response(
            {
                "message": "Operator access revoked successfully.",
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )


class RejectedUsersView(APIView):

    permission_classes = [IsAdminRole]

    def get(self, request):
        users = User.objects.filter(
            role=User.Role.OPERATOR,
            account_status=User.AccountStatus.REJECTED,
        )
        serializer = PendingUserSerializer(users, many=True)
        return Response(serializer.data)