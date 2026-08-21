from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="receipt",
            field=models.FileField(blank=True, null=True, upload_to="expense_receipts/"),
        ),
        migrations.AddField(
            model_name="expense",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]