from django.db import models


class Mode(models.Model):
    """Modes de fonctionnement de la machine."""
    
    # Identification
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Nom du mode",
        help_text="Ex: Permissif, Dégradé, Maintenance"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Description détaillée du mode et de ses implications"
    )
    
    # État
    is_enabled = models.BooleanField(
        default=False,
        verbose_name="Activé",
        help_text="Indique si ce mode est actuellement activé"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif",
        help_text="Mode disponible dans le système"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Mode de fonctionnement"
        verbose_name_plural = "Modes de fonctionnement"
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_enabled', 'is_active']),
        ]
    
    def __str__(self):
        return self.name


class MoodCounter(models.Model):
    """Compteur d'humeur pour suivi anonyme."""
    
    MOOD_CHOICES = [
        ('no_response', 'Sans réponse'),
        ('happy', 'Content'),
        ('unhappy', 'Pas content'),
        ('neutral', 'Neutre'),
    ]
    
    # Type d'humeur
    mood_type = models.CharField(
        max_length=20,
        choices=MOOD_CHOICES,
        unique=True,
        verbose_name="Type d'humeur"
    )
    
    # Compteur
    count = models.PositiveIntegerField(
        default=0,
        verbose_name="Nombre de fois sélectionnée"
    )
    
    # Métadonnées
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Compteur d'humeur"
        verbose_name_plural = "Compteurs d'humeur"
        ordering = ['mood_type']
    
    def __str__(self):
        return f"{self.get_mood_type_display()} ({self.count})"


class LostTimeEntry(models.Model):
    """Entrées de temps d'arrêt."""
    
    # Relations
    shift = models.ForeignKey(
        'production.Shift',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='lost_time_entries',
        verbose_name="Poste",
        help_text="Poste associé (si déjà sauvegardé)"
    )
    
    session_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Clé de session pour lier au shift en cours"
    )
    
    # Motif d'arrêt
    reason = models.ForeignKey(
        'catalog.WcmLostTimeReason',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='entries',
        verbose_name="Motif",
        help_text="Motif de l'arrêt depuis le catalogue"
    )
    
    motif = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Motif (texte libre)",
        help_text="Motif d'arrêt en texte libre (déprécié)"
    )
    
    # Détails
    comment = models.TextField(
        blank=True,
        verbose_name="Commentaire"
    )
    
    duration = models.PositiveIntegerField(
        verbose_name="Durée (minutes)",
        help_text="Durée de l'arrêt en minutes"
    )
    
    # Traçabilité
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'planification.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Créé par"
    )
    
    class Meta:
        verbose_name = "Temps d'arrêt"
        verbose_name_plural = "Temps d'arrêt"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shift', '-created_at']),
            models.Index(fields=['session_key', '-created_at']),
            models.Index(fields=['reason', '-created_at']),
        ]
    
    def __str__(self):
        if self.reason:
            return f"{self.reason.name} - {self.duration} min"
        elif self.motif:
            return f"{self.motif} - {self.duration} min"
        return f"Arrêt - {self.duration} min"



class ChecklistResponse(models.Model):
    """Réponses aux items de check-list."""
    
    RESPONSE_CHOICES = [
        ('ok', 'OK'),
        ('na', 'N/A'),
        ('nok', 'NOK'),
    ]
    
    # Relations
    shift = models.ForeignKey(
        'production.Shift',
        on_delete=models.CASCADE,
        related_name='checklist_responses',
        verbose_name="Poste"
    )
    
    item = models.ForeignKey(
        'catalog.WcmChecklistItem',
        on_delete=models.CASCADE,
        verbose_name="Item de check-list"
    )
    
    # Réponse
    response = models.CharField(
        max_length=3,
        choices=RESPONSE_CHOICES,
        verbose_name="Réponse"
    )
    
    comment = models.TextField(
        blank=True,
        verbose_name="Commentaire",
        help_text="Commentaire optionnel, obligatoire si NOK"
    )
    
    # Traçabilité
    responded_by = models.ForeignKey(
        'planification.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Répondu par"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Réponse check-list"
        verbose_name_plural = "Réponses check-list"
        ordering = ['shift', 'item']
        unique_together = [['shift', 'item']]
        indexes = [
            models.Index(fields=['shift', 'response']),
            models.Index(fields=['item', 'response']),
        ]
    
    def __str__(self):
        return f"{self.shift} - {self.item}: {self.get_response_display()}"