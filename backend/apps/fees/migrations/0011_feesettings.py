from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0010_simplepayment_late_fee_days_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeeSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fee_due_day', models.PositiveIntegerField(
                    default=10,
                    help_text='Day of month when fees are due (e.g., 10 for the 10th).',
                )),
                ('late_fee_per_day', models.DecimalField(
                    decimal_places=2,
                    default=10,
                    help_text='Late fee charged per day after the due day, e.g. \u20b910 per day late.',
                    max_digits=8,
                )),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Fee Settings',
                'verbose_name_plural': 'Fee Settings',
            },
        ),
    ]
