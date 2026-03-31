from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_documentupload_extracted_json'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documentupload',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('processing', 'Processing'),
                    ('for_review', 'For Review'),
                    ('completed', 'Completed'),
                    ('failed', 'Failed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
