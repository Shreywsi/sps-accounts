from rest_framework import serializers

from apps.students.models import Student


class StudentSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    school_class_name = serializers.CharField(
        source="school_class.name",
        read_only=True,
    )

    section_name = serializers.CharField(
        source="academic_section.name",
        read_only=True,
    )

    class Meta:
        model = Student
        fields = "__all__"
        read_only_fields = [
            "full_name",
            "school_class_name",
            "section_name",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def validate(self, data):
        school_class = data.get("school_class")
        academic_section = data.get("academic_section")

        if school_class and academic_section:
            if academic_section.school_class != school_class:
                raise serializers.ValidationError(
                    {
                        "academic_section": (
                            "This section does not belong to the selected class."
                        )
                    }
                )

        return data