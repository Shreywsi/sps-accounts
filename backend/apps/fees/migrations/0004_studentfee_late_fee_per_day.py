from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("fees", "0003_remove_studentfee_assigned_date_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="studentfee",
            name="late_fee_per_day",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=8),
        ),
    ]