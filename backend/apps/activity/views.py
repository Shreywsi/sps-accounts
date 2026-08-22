from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta

from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["action_type", "actor_role", "actor"]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Only admins can see all activities
        if self.request.user.role != "ADMIN":
            # Non-admins can only see their own activities
            queryset = queryset.filter(actor=self.request.user)
        
        return queryset

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Get activities from today"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(timestamp__date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def this_week(self, request):
        """Get activities from this week"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        queryset = self.get_queryset().filter(timestamp__date__gte=week_start)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def last_month(self, request):
        """Get activities from the last month"""
        today = timezone.now().date()
        last_month = today - timedelta(days=30)
        queryset = self.get_queryset().filter(timestamp__date__gte=last_month)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_date_range(self, request):
        """Get activities by custom date range"""
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        
        if not start_date or not end_date:
            return Response(
                {"error": "Both start_date and end_date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get activity summary statistics"""
        queryset = self.get_queryset()
        
        summary = {
            "total_activities": queryset.count(),
            "by_action_type": {},
            "by_role": {},
            "recent_activities": ActivityLogSerializer(
                queryset[:10], many=True
            ).data
        }
        
        # Count by action type
        for action_type, _ in ActivityLog.ActionType.choices:
            count = queryset.filter(action_type=action_type).count()
            if count > 0:
                summary["by_action_type"][action_type] = count
        
        # Count by role
        summary["by_role"]["ADMIN"] = queryset.filter(actor_role="ADMIN").count()
        summary["by_role"]["OPERATOR"] = queryset.filter(actor_role="OPERATOR").count()
        
        return Response(summary)