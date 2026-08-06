from django.db import migrations


def populate_student_academics(apps, schema_editor):
    Student = apps.get_model("students", "Student")
    SchoolClass = apps.get_model("academics", "SchoolClass")
    Section = apps.get_model("academics", "Section")

    for student in Student.objects.all():

        school_class = SchoolClass.objects.filter(
            name=f"Class {student.class_name}"
        ).first()

        if school_class:
            student.school_class = school_class

            section = Section.objects.filter(
                school_class=school_class,
                name=student.section,
            ).first()

            if section:
                student.academic_section = section

            student.save()


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0003_student_academic_section_student_school_class"),
    ]

    operations = [
        migrations.RunPython(populate_student_academics),
    ]