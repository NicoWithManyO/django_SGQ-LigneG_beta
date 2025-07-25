# Generated by Django 5.2.4 on 2025-07-25 20:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalog', '0001_initial'),
        ('planification', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CurrentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('selected_at', models.DateTimeField(auto_now=True, verbose_name='Sélectionné le')),
                ('profile', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='catalog.profiletemplate', verbose_name='Profil actuel')),
            ],
            options={
                'verbose_name': 'Profil actuel',
                'verbose_name_plural': 'Profils actuels',
            },
        ),
        migrations.CreateModel(
            name='Shift',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('shift_id', models.CharField(help_text='Format: JJMMAA_PrenomNom_Vacation', max_length=50, unique=True, verbose_name='ID du poste')),
                ('date', models.DateField(help_text='Date du poste de production', verbose_name='Date')),
                ('vacation', models.CharField(choices=[('Matin', 'Matin'), ('ApresMidi', 'Après-midi'), ('Nuit', 'Nuit'), ('Journee', 'Journée')], help_text='Période de travail', max_length=20, verbose_name='Vacation')),
                ('start_time', models.TimeField(blank=True, help_text='Heure de début du poste', null=True, verbose_name='Heure de début')),
                ('end_time', models.TimeField(blank=True, help_text='Heure de fin du poste', null=True, verbose_name='Heure de fin')),
                ('availability_time', models.DurationField(blank=True, help_text="Temps de disponibilité = Temps d'ouverture - Temps perdu", null=True, verbose_name='Temps disponible')),
                ('lost_time', models.DurationField(blank=True, help_text="Somme des temps d'arrêt", null=True, verbose_name='Temps perdu')),
                ('total_length', models.DecimalField(decimal_places=2, default=0, help_text='Longueur totale produite', max_digits=10, verbose_name='Longueur totale (m)')),
                ('ok_length', models.DecimalField(decimal_places=2, default=0, help_text='Longueur de production conforme', max_digits=10, verbose_name='Longueur conforme (m)')),
                ('nok_length', models.DecimalField(decimal_places=2, default=0, help_text='Longueur de production non conforme', max_digits=10, verbose_name='Longueur non conforme (m)')),
                ('raw_waste_length', models.DecimalField(decimal_places=2, default=0, help_text='Longueur de déchet brut', max_digits=10, verbose_name='Déchet brut (m)')),
                ('avg_thickness_left_shift', models.DecimalField(blank=True, decimal_places=2, help_text='Moyenne des épaisseurs gauches de tous les rouleaux', max_digits=5, null=True, verbose_name='Épaisseur moyenne gauche (mm)')),
                ('avg_thickness_right_shift', models.DecimalField(blank=True, decimal_places=2, help_text='Moyenne des épaisseurs droites de tous les rouleaux', max_digits=5, null=True, verbose_name='Épaisseur moyenne droite (mm)')),
                ('avg_grammage_shift', models.DecimalField(blank=True, decimal_places=1, help_text='Moyenne des grammages de tous les rouleaux', max_digits=6, null=True, verbose_name='Grammage moyen (g/m)')),
                ('started_at_beginning', models.BooleanField(default=False, help_text='Machine démarrée en début de poste', verbose_name='Machine démarrée en début')),
                ('meter_reading_start', models.DecimalField(blank=True, decimal_places=2, help_text='Relevé compteur en début de poste', max_digits=10, null=True, verbose_name='Métrage début (m)')),
                ('started_at_end', models.BooleanField(default=False, help_text='Machine démarrée en fin de poste', verbose_name='Machine démarrée en fin')),
                ('meter_reading_end', models.DecimalField(blank=True, decimal_places=2, help_text='Relevé compteur en fin de poste', max_digits=10, null=True, verbose_name='Métrage fin (m)')),
                ('checklist_signed', models.CharField(blank=True, help_text="Initiales de l'opérateur", max_length=5, null=True, verbose_name='Signature check-list')),
                ('checklist_signed_time', models.TimeField(blank=True, null=True, verbose_name='Heure signature check-list')),
                ('operator_comments', models.TextField(blank=True, help_text="Observations de l'opérateur", verbose_name='Commentaires opérateur')),
                ('wound_length_end', models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=10, null=True, verbose_name='Longueur enroulée fin (temporaire)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('operator', models.ForeignKey(help_text='Opérateur responsable du poste', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shifts', to='planification.operator', verbose_name='Opérateur')),
            ],
            options={
                'verbose_name': 'Poste',
                'verbose_name_plural': 'Postes',
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Roll',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('roll_id', models.CharField(help_text='Format: OF_NumRouleau (ex: OF12345_001)', max_length=50, unique=True, verbose_name='ID Rouleau')),
                ('shift_id_str', models.CharField(blank=True, help_text='ID du poste conservé même après suppression', max_length=50, null=True, verbose_name='ID du poste (texte)')),
                ('session_key', models.CharField(blank=True, help_text='Clé de session pour lier au shift en cours', max_length=255, null=True)),
                ('roll_number', models.PositiveIntegerField(blank=True, null=True, verbose_name='N° Rouleau')),
                ('length', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Longueur (m)')),
                ('tube_mass', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Masse tube (g)')),
                ('total_mass', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Masse totale (g)')),
                ('net_mass', models.DecimalField(blank=True, decimal_places=2, help_text='Masse totale - Masse tube', max_digits=10, null=True, verbose_name='Masse nette (g)')),
                ('status', models.CharField(choices=[('CONFORME', 'Conforme'), ('NON_CONFORME', 'Non conforme')], default='CONFORME', max_length=20, verbose_name='Statut')),
                ('destination', models.CharField(choices=[('PRODUCTION', 'Production'), ('DECOUPE', 'Découpe'), ('DECOUPE_FORCEE', 'Découpe Forcée'), ('DECHETS', 'Déchets')], default='PRODUCTION', max_length=20, verbose_name='Destination')),
                ('has_blocking_defects', models.BooleanField(default=False, verbose_name='Défauts bloquants')),
                ('has_thickness_issues', models.BooleanField(default=False, verbose_name="Problèmes d'épaisseur")),
                ('avg_thickness_left', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Épaisseur moyenne gauche (mm)')),
                ('avg_thickness_right', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Épaisseur moyenne droite (mm)')),
                ('grammage_calc', models.DecimalField(blank=True, decimal_places=2, help_text='Grammage calculé et sauvegardé', max_digits=7, null=True, verbose_name='Grammage calculé (g/m)')),
                ('comment', models.TextField(blank=True, help_text='Commentaire libre sur le rouleau', null=True, verbose_name='Commentaire')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('fabrication_order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='rolls', to='planification.fabricationorder', verbose_name='Ordre de fabrication')),
                ('shift', models.ForeignKey(blank=True, help_text='Poste associé (sera lié lors de la sauvegarde du poste)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rolls', to='production.shift', verbose_name='Poste de production')),
            ],
            options={
                'verbose_name': 'Rouleau',
                'verbose_name_plural': 'Rouleaux',
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddIndex(
            model_name='shift',
            index=models.Index(fields=['-date', 'vacation'], name='production__date_01510c_idx'),
        ),
        migrations.AddIndex(
            model_name='shift',
            index=models.Index(fields=['operator', '-date'], name='production__operato_316246_idx'),
        ),
        migrations.AddIndex(
            model_name='roll',
            index=models.Index(fields=['status', '-created_at'], name='production__status_26e845_idx'),
        ),
        migrations.AddIndex(
            model_name='roll',
            index=models.Index(fields=['fabrication_order', 'roll_number'], name='production__fabrica_bcb214_idx'),
        ),
        migrations.AddIndex(
            model_name='roll',
            index=models.Index(fields=['session_key', '-created_at'], name='production__session_eda937_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='roll',
            unique_together={('shift', 'roll_number')},
        ),
    ]
