# Generated manually to migrate checklist data

from django.db import migrations


def migrate_checklist_items(apps, schema_editor):
    """Migre les items existants vers le nouveau modèle."""
    WcmChecklistItem = apps.get_model('catalog', 'WcmChecklistItem')
    WcmChecklistTemplate = apps.get_model('catalog', 'WcmChecklistTemplate')
    WcmChecklistTemplateItem = apps.get_model('catalog', 'WcmChecklistTemplateItem')
    
    # Récupérer le template existant
    template = WcmChecklistTemplate.objects.filter(name="Checklist Prise/Fin de poste").first()
    
    if template:
        # Créer les items comme catalogue indépendant
        items_data = [
            ("Vérifier la présence et l'état des EPI (casque, lunettes, chaussures)", "Sécurité", 1, True),
            ("Contrôler les dispositifs d'arrêt d'urgence", "Sécurité", 2, True),
            ("Vérifier la propreté et le rangement du poste de travail", "Production", 3, True),
            ("Contrôler l'état des outils et équipements", "Production", 4, True),
            ("Vérifier les niveaux (huile, lubrifiant, liquide de refroidissement)", "Maintenance", 5, True),
            ("Contrôler les paramètres machine selon la fiche de production", "Production", 6, True),
            ("Vérifier la conformité des matières premières disponibles", "Qualité", 7, True),
            ("Contrôler le stock de consommables (étiquettes, film, cartons)", "Production", 8, False),
            ("Lire les consignes du poste précédent dans le cahier de liaison", "Communication", 9, True),
            ("Noter les événements et anomalies dans le cahier de liaison", "Communication", 10, True),
        ]
        
        for text, category, order, is_required in items_data:
            # Créer ou récupérer l'item
            item, created = WcmChecklistItem.objects.get_or_create(
                text=text,
                defaults={'category': category, 'is_active': True}
            )
            
            # Associer au template via la table intermédiaire
            WcmChecklistTemplateItem.objects.get_or_create(
                template=template,
                item=item,
                defaults={'order': order, 'is_required': is_required}
            )


def reverse_migration(apps, schema_editor):
    """Reverse la migration."""
    # La migration inverse n'est pas nécessaire car on garde les données
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0011_wcmchecklisttemplateitem_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_checklist_items, reverse_migration),
    ]