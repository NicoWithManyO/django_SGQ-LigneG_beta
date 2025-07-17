from django.db import models


class Shift(models.Model):
    """Modèle représentant un poste de production."""
    
    VACATION_CHOICES = [
        ('Matin', 'Matin'),
        ('ApresMidi', 'Après-midi'),
        ('Nuit', 'Nuit'),
        ('Journee', 'Journée'),
    ]
    
    # Identifiant unique
    shift_id = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name="ID du poste",
        help_text="Format: JJMMAA_PrenomNom_Vacation"
    )
    
    # Informations principales
    date = models.DateField(
        verbose_name="Date",
        help_text="Date du poste de production"
    )
    
    operator = models.ForeignKey(
        'planification.Operator',
        on_delete=models.SET_NULL,
        null=True,
        related_name='shifts',
        verbose_name="Opérateur",
        help_text="Opérateur responsable du poste"
    )
    
    vacation = models.CharField(
        max_length=20,
        choices=VACATION_CHOICES,
        verbose_name="Vacation",
        help_text="Période de travail"
    )
    
    # Horaires
    start_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Heure de début",
        help_text="Heure de début du poste"
    )
    
    end_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Heure de fin",
        help_text="Heure de fin du poste"
    )
    
    # Temps de production
    availability_time = models.DurationField(
        null=True,
        blank=True,
        verbose_name="Temps disponible",
        help_text="Temps de disponibilité = Temps d'ouverture - Temps perdu"
    )
    
    lost_time = models.DurationField(
        null=True,
        blank=True,
        verbose_name="Temps perdu",
        help_text="Somme des temps d'arrêt"
    )
    
    # Production
    total_length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Longueur totale (m)",
        help_text="Longueur totale produite"
    )
    
    ok_length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Longueur conforme (m)",
        help_text="Longueur de production conforme"
    )
    
    nok_length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Longueur non conforme (m)",
        help_text="Longueur de production non conforme"
    )
    
    raw_waste_length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Déchet brut (m)",
        help_text="Longueur de déchet brut"
    )
    
    # Moyennes du poste
    avg_thickness_left_shift = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Épaisseur moyenne gauche (mm)",
        help_text="Moyenne des épaisseurs gauches de tous les rouleaux"
    )
    
    avg_thickness_right_shift = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Épaisseur moyenne droite (mm)",
        help_text="Moyenne des épaisseurs droites de tous les rouleaux"
    )
    
    avg_grammage_shift = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name="Grammage moyen (g/m)",
        help_text="Moyenne des grammages de tous les rouleaux"
    )
    
    # État machine
    started_at_beginning = models.BooleanField(
        default=False,
        verbose_name="Machine démarrée en début",
        help_text="Machine démarrée en début de poste"
    )
    
    meter_reading_start = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Métrage début (m)",
        help_text="Relevé compteur en début de poste"
    )
    
    started_at_end = models.BooleanField(
        default=False,
        verbose_name="Machine démarrée en fin",
        help_text="Machine démarrée en fin de poste"
    )
    
    meter_reading_end = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Métrage fin (m)",
        help_text="Relevé compteur en fin de poste"
    )
    
    # Check-list
    checklist_signed = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        verbose_name="Signature check-list",
        help_text="Initiales de l'opérateur"
    )
    
    checklist_signed_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Heure signature check-list"
    )
    
    # Commentaires
    operator_comments = models.TextField(
        blank=True,
        verbose_name="Commentaires opérateur",
        help_text="Observations de l'opérateur"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Poste"
        verbose_name_plural = "Postes"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['-date', 'vacation']),
            models.Index(fields=['operator', '-date']),
        ]
    
    def __str__(self):
        return self.shift_id
    
    def save(self, *args, **kwargs):
        """Génère automatiquement le shift_id si non fourni."""
        # Générer le shift_id si non fourni
        if not self.shift_id:
            date_str = self.date.strftime('%d%m%y')
            if self.operator:
                operator_clean = f"{self.operator.first_name}{self.operator.last_name}".replace(' ', '')
            else:
                operator_clean = "SansOperateur"
            self.shift_id = f"{date_str}_{operator_clean}_{self.vacation}"
        
        super().save(*args, **kwargs)
    


class Roll(models.Model):
    """Modèle représentant un rouleau de production."""
    
    STATUS_CHOICES = [
        ('CONFORME', 'Conforme'),
        ('NON_CONFORME', 'Non conforme'),
    ]
    
    DESTINATION_CHOICES = [
        ('PRODUCTION', 'Production'),
        ('DECOUPE', 'Découpe'),
        ('DECOUPE_FORCEE', 'Découpe Forcée'),
        ('DECHETS', 'Déchets'),
    ]
    
    # Identifiant unique
    roll_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="ID Rouleau",
        help_text="Format: OF_NumRouleau (ex: OF12345_001)"
    )
    
    # Relations
    shift = models.ForeignKey(
        Shift,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rolls',
        verbose_name="Poste de production",
        help_text="Poste associé (sera lié lors de la sauvegarde du poste)"
    )
    
    shift_id_str = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="ID du poste (texte)",
        help_text="ID du poste conservé même après suppression"
    )
    
    session_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Clé de session pour lier au shift en cours"
    )
    
    fabrication_order = models.ForeignKey(
        'planification.FabricationOrder',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='rolls',
        verbose_name="Ordre de fabrication"
    )
    
    # Données de production
    roll_number = models.PositiveIntegerField(
        verbose_name="N° Rouleau"
    )
    
    length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Longueur (m)"
    )
    
    tube_mass = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Masse tube (g)"
    )
    
    total_mass = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Masse totale (g)"
    )
    
    net_mass = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Masse nette (g)",
        help_text="Masse totale - Masse tube"
    )
    
    # Statut et destination
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CONFORME',
        verbose_name="Statut"
    )
    
    destination = models.CharField(
        max_length=20,
        choices=DESTINATION_CHOICES,
        default='PRODUCTION',
        verbose_name="Destination"
    )
    
    # Détails de conformité
    has_blocking_defects = models.BooleanField(
        default=False,
        verbose_name="Défauts bloquants"
    )
    
    has_thickness_issues = models.BooleanField(
        default=False,
        verbose_name="Problèmes d'épaisseur"
    )
    
    # Moyennes d'épaisseurs
    avg_thickness_left = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Épaisseur moyenne gauche (mm)"
    )
    
    avg_thickness_right = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Épaisseur moyenne droite (mm)"
    )
    
    # Grammage calculé
    grammage_calc = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Grammage calculé (g/m)",
        help_text="Grammage calculé et sauvegardé"
    )
    
    # Commentaire
    comment = models.TextField(
        blank=True,
        null=True,
        verbose_name="Commentaire",
        help_text="Commentaire libre sur le rouleau"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Rouleau"
        verbose_name_plural = "Rouleaux"
        ordering = ['-created_at', '-id']
        unique_together = [['shift', 'roll_number']]
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['fabrication_order', 'roll_number']),
            models.Index(fields=['session_key', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.roll_id} - {self.length}m" if self.length else self.roll_id
    
    def save(self, *args, **kwargs):
        """Génère automatiquement le roll_id si non fourni."""
        # Génération du roll_id si non fourni
        if not self.roll_id:
            if self.fabrication_order and self.roll_number:
                # Format standard: OF_NumRouleau
                self.roll_id = f"{self.fabrication_order.order_number}_{self.roll_number:03d}"
            else:
                # Format alternatif si pas d'OF: ROLL_YYYYMMDD_HHMMSS
                from datetime import datetime
                now = datetime.now()
                self.roll_id = f"ROLL_{now.strftime('%Y%m%d_%H%M%S')}"
        
        super().save(*args, **kwargs)


class CurrentProfile(models.Model):
    """Profil actuellement sélectionné dans la production."""
    
    profile = models.ForeignKey(
        'catalog.ProfileTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Profil actuel"
    )
    
    selected_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Sélectionné le"
    )
    
    class Meta:
        verbose_name = "Profil actuel"
        verbose_name_plural = "Profils actuels"
    
    def __str__(self):
        return f"Profil actuel: {self.profile.name if self.profile else 'Aucun'}"
    
