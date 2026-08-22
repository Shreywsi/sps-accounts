from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("fees", "0004_studentfee_late_fee_per_day"),
    ]

    operations = [
        migrations.AddField(
            model_name="feestructure",
            name="due_date",
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="feestructure",
            name="late_fee_per_day",
            field=models.DecimalField(max_digits=8, decimal_places=2, default=0),
        ),
    ]