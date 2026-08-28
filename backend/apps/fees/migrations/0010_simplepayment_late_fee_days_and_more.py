from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0009_feecategorygroup_feesession_feehead_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='simplepayment',
            name='late_fee_days',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Number of days late this payment was made, snapshotted at creation time.',
            ),
        ),
        migrations.AddField(
            model_name='simplepayment',
            name='late_fee_charged',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=8,
                help_text='Late fee amount snapshotted at creation time (days_late x rate at that time).',
            ),
        ),
    ]
