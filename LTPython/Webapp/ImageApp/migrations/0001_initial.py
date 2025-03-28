# Generated by Django 5.1.6 on 2025-03-19 12:18

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Chat',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('password_hash', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'imageapp_user',
            },
        ),
        migrations.CreateModel(
            name='ChatTurn',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('turn_number', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ImageApp.chat')),
            ],
        ),
        migrations.CreateModel(
            name='ChatbotMessage',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('sender', models.CharField(max_length=255)),
                ('message_text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chat_turn', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ImageApp.chatturn')),
            ],
        ),
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('sender', models.CharField(max_length=255)),
                ('prompt_text', models.TextField()),
                ('image_url', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chat_turn', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ImageApp.chatturn')),
            ],
        ),
        migrations.AddField(
            model_name='chat',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ImageApp.user'),
        ),
    ]
