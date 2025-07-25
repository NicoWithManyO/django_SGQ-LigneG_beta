from django.db.models.signals import post_save
from django.dispatch import receiver
from production.models import Roll
from .services import RollExcelExporter
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Roll)
def export_roll_to_excel(sender, instance, created, **kwargs):
    """Signal pour exporter automatiquement chaque rouleau sauvegardé."""
    # Exporter les nouveaux rouleaux et les mises à jour
    try:
        exporter = RollExcelExporter()
        # Pour les mises à jour, on utilise update=True (défaut)
        # Pour les créations, on pourrait forcer update=False mais ce n'est pas nécessaire
        success, result = exporter.export_roll(instance, update=True)
        
        if success:
            action = "créé et exporté" if created else "mis à jour"
            logger.info(f"Rouleau {instance.roll_id} {action} dans {result}")
        else:
            logger.error(f"Erreur export rouleau {instance.roll_id}: {result}")
            
    except Exception as e:
        logger.error(f"Erreur signal export rouleau {instance.roll_id}: {str(e)}")