from rest_framework import serializers

from apps.students.models import Student, CustomFieldDefinition, StudentCustomFieldValue


class StudentCustomFieldValueSerializer(serializers.ModelSerializer):
    field_id = serializers.PrimaryKeyRelatedField(
        source="field",
        queryset=CustomFieldDefinition.objects.all(),
    )
    field_name = serializers.CharField(source="field.name", read_only=True)

    class Meta:
        model = StudentCustomFieldValue
        fields = ["field_id", "field_name", "value"]


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

    custom_values = StudentCustomFieldValueSerializer(
        many=True,
        required=False,
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

    def to_representation(self, instance):
        # CloudinaryField doesn't serialize to a usable URL by default under
        # fields = "__all__" — force it to output the real, absolute image URL.
        data = super().to_representation(instance)
        data["photo"] = instance.photo.url if instance.photo else None
        return data

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

    def create(self, validated_data):
        custom_values_data = validated_data.pop("custom_values", [])
        student = Student.objects.create(**validated_data)
        self._save_custom_values(student, custom_values_data)
        return student

    def update(self, instance, validated_data):
        custom_values_data = validated_data.pop("custom_values", None)
        instance = super().update(instance, validated_data)
        if custom_values_data is not None:
            self._save_custom_values(instance, custom_values_data)
        return instance

    def _save_custom_values(self, student, custom_values_data):
        for item in custom_values_data:
            value = item.get("value", "")
            if value == "":
                # An explicitly empty value means "remove this field for
                # this student" (e.g. they cleared it or hit the clear
                # button), not "save an empty string".
                StudentCustomFieldValue.objects.filter(
                    student=student, field=item["field"]
                ).delete()
            else:
                StudentCustomFieldValue.objects.update_or_create(
                    student=student,
                    field=item["field"],
                    defaults={"value": value},
                )