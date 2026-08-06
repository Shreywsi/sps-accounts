from rest_framework import serializers

from apps.academics.models import AcademicSession


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = "__all__"