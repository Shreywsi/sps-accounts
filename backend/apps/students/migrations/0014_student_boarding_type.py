from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0013_student_annual_fee_paid_alter_student_total_fee_paid"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="boarding_type",
            field=models.CharField(
                choices=[("day_scholar", "Day Scholar"), ("hostel", "Hostel")],
                default="day_scholar",
                help_text="Whether the student is a day scholar or a hosteler - drives which fee group (day scholar vs hostel) is used for this student.",
                max_length=20,
            ),
        ),
    ]