from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.transactions.serializers.transaction import (
    TransactionSerializer,
)


class TransactionCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):

        serializer = TransactionSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        transaction = serializer.save()

        return Response(
            TransactionSerializer(transaction).data,
            status=status.HTTP_201_CREATED,
        )