from django.db.models import Q

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.students.models import Student
from apps.students.serializers.student import StudentSerializer


class StudentSearchView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        query = request.GET.get("q", "").strip()

        students = Student.objects.filter(
            Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(admission_no__icontains=query)
        ).filter(
            verification_status="VERIFIED",
            is_active=True,
        )[:10]

        serializer = StudentSerializer(
            students,
            many=True,
        )

        return Response(serializer.data)