from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0009_customfielddefinition_studentcustomfieldvalue'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='rejection_reason',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Set by the admin when rejecting a student, shown to the operator.',
            ),
        ),
    ]