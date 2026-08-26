from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.fees.models import (
    FeeSession,
    FeeCategoryGroup,
    FeeHead,
    UniformFeeItem,
    ClassFeeMapping,
    StudentFeeAssignment,
)
from apps.fees.serializers.fee_session import FeeSessionSerializer
from apps.fees.serializers.fee_category_group import FeeCategoryGroupSerializer
from apps.fees.serializers.fee_head import FeeHeadSerializer
from apps.fees.serializers.uniform_fee_item import UniformFeeItemSerializer
from apps.fees.serializers.class_fee_mapping import ClassFeeMappingSerializer
from apps.fees.serializers.student_fee_assignment import StudentFeeAssignmentSerializer
from apps.students.permissions import IsAdminOrOperator, IsAdminRole


class FeeSessionViewSet(viewsets.ModelViewSet):
    queryset = FeeSession.objects.all()
    serializer_class = FeeSessionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        # Both roles need to read sessions (fee-structure page, fee
        # collection screen), but only an admin may create/change/delete
        # the session itself.
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated(), IsAdminOrOperator()]

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get the currently active session"""
        session = FeeSession.objects.filter(is_active=True).first()
        if session:
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        return Response({"detail": "No active session found"}, status=status.HTTP_404_NOT_FOUND)


class FeeCategoryGroupViewSet(viewsets.ModelViewSet):
    queryset = FeeCategoryGroup.objects.select_related("session").all()
    serializer_class = FeeCategoryGroupSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["session", "boarding_type"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated(), IsAdminOrOperator()]

    @action(detail=True, methods=["get"])
    def fee_heads(self, request, pk=None):
        """Get all fee heads for this group"""
        group = self.get_object()
        heads = group.fee_heads.filter(is_active=True).order_by("display_order")
        serializer = FeeHeadSerializer(heads, many=True)
        return Response(serializer.data)


class FeeHeadViewSet(viewsets.ModelViewSet):
    queryset = FeeHead.objects.select_related("group").all()
    serializer_class = FeeHeadSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["group", "frequency", "is_active", "editable_by"]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        if self.action in ["update", "partial_update"]:
            # Check if the head is editable by operator
            if self.request.user.role == "OPERATOR":
                head = self.get_object()
                if head.editable_by != "admin_operator":
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("This fee head can only be edited by admins")
            return [IsAuthenticated(), IsAdminOrOperator()]
        return [IsAuthenticated(), IsAdminOrOperator()]


class UniformFeeItemViewSet(viewsets.ModelViewSet):
    queryset = UniformFeeItem.objects.select_related("session").all()
    serializer_class = UniformFeeItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["session", "gender", "is_active"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated(), IsAdminOrOperator()]


class ClassFeeMappingViewSet(viewsets.ModelViewSet):
    queryset = ClassFeeMapping.objects.select_related("session", "day_scholar_group", "hostel_group").all()
    serializer_class = ClassFeeMappingSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["session", "class_name"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated(), IsAdminOrOperator()]

    @action(detail=False, methods=["get"])
    def by_class(self, request):
        """Get fee mapping for a specific class"""
        class_name = request.query_params.get("class_name")
        session_id = request.query_params.get("session")
        if not class_name:
            return Response({"detail": "class_name parameter required"}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        else:
            # Use active session if not specified
            active_session = FeeSession.objects.filter(is_active=True).first()
            if active_session:
                queryset = queryset.filter(session=active_session)

        mapping = queryset.filter(class_name=class_name).first()
        if mapping:
            serializer = self.get_serializer(mapping)
            return Response(serializer.data)
        return Response({"detail": "No fee mapping found for this class"}, status=status.HTTP_404_NOT_FOUND)


class StudentFeeAssignmentViewSet(viewsets.ModelViewSet):
    queryset = StudentFeeAssignment.objects.select_related("student", "session").all()
    serializer_class = StudentFeeAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["student", "session", "boarding_type"]

    @action(detail=False, methods=["post"])
    def create_from_template(self, request):
        """Create a fee assignment from the current fee structure template"""
        student_id = request.data.get("student_id")
        session_id = request.data.get("session_id")
        boarding_type = request.data.get("boarding_type", "day_scholar")

        if not student_id or not session_id:
            return Response(
                {"detail": "student_id and session_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from apps.students.models import Student
            student = Student.objects.get(id=student_id)
            session = FeeSession.objects.get(id=session_id)

            # Get class mapping
            from apps.fees.models import ClassFeeMapping
            mapping = ClassFeeMapping.objects.filter(
                session=session,
                class_name=student.school_class_name or student.school_class
            ).first()

            if not mapping:
                return Response(
                    {"detail": "No fee mapping found for this student's class"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get appropriate fee group based on boarding type
            fee_group = None
            if boarding_type == "day_scholar":
                fee_group = mapping.day_scholar_group
            elif boarding_type == "hostel":
                fee_group = mapping.hostel_group

            if not fee_group:
                return Response(
                    {"detail": f"No fee group configured for {boarding_type} in this class"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Copy fee heads from the group
            fee_heads = []
            for head in fee_group.fee_heads.filter(is_active=True):
                fee_heads.append({
                    "id": head.id,
                    "label": head.label,
                    "frequency": head.frequency,
                    "amount": float(head.amount),
                    "annual_equivalent": float(head.annual_equivalent),
                    "is_mandatory": head.is_mandatory,
                    "is_active": True,
                    "is_custom": False,
                })

            # Create assignment
            assignment = StudentFeeAssignment.objects.create(
                student=student,
                session=session,
                boarding_type=boarding_type,
                fee_heads=fee_heads,
                created_from_template=True,
                last_modified_by=request.user
            )

            serializer = self.get_serializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Student.DoesNotExist:
            return Response({"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except FeeSession.DoesNotExist:
            return Response({"detail": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
