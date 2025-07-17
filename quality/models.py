from django.db import models


class RollDefect(models.Model):
    """Défauts constatés sur les rouleaux."""
    
    POSITION_SIDE_CHOICES = [
        ('left', 'Gauche'),
        ('center', 'Centre'),
        ('right', 'Droite'),
    ]
    
    # Relations
    roll = models.ForeignKey(
        'production.Roll',
        on_delete=models.CASCADE,
        related_name='defects',
        verbose_name="Rouleau"
    )
    
    defect_type = models.ForeignKey(
        'catalog.QualityDefectType',
        on_delete=models.PROTECT,
        related_name='occurrences',
        verbose_name="Type de défaut"
    )
    
    # Position sur le rouleau
    meter_position = models.PositiveIntegerField(
        verbose_name="Position (m)",
        help_text="Position du défaut en mètres depuis le début"
    )
    
    side_position = models.CharField(
        max_length=10,
        choices=POSITION_SIDE_CHOICES,
        verbose_name="Côté",
        help_text="Position latérale du défaut"
    )
    
    # Détails
    comment = models.TextField(
        blank=True,
        verbose_name="Commentaire",
        help_text="Détails supplémentaires sur le défaut"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Défaut rouleau"
        verbose_name_plural = "Défauts rouleaux"
        ordering = ['roll', 'meter_position']
        unique_together = [['roll', 'meter_position', 'side_position', 'defect_type']]
        indexes = [
            models.Index(fields=['roll', 'meter_position']),
            models.Index(fields=['defect_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.roll.roll_id} - {self.defect_type.name} à {self.meter_position}m ({self.get_side_position_display()})"


class RollThickness(models.Model):
    """Mesures d'épaisseur sur les rouleaux."""
    
    MEASUREMENT_POINTS = [
        ('GG', 'Gauche Gauche'),
        ('GC', 'Gauche Centre'),
        ('GD', 'Gauche Droite'),
        ('DG', 'Droite Gauche'),
        ('DC', 'Droite Centre'),
        ('DD', 'Droite Droite'),
    ]
    
    # Relations
    roll = models.ForeignKey(
        'production.Roll',
        on_delete=models.CASCADE,
        related_name='thickness_measurements',
        verbose_name="Rouleau"
    )
    
    # Position et point de mesure
    meter_position = models.PositiveIntegerField(
        verbose_name="Position (m)",
        help_text="Position de la mesure en mètres"
    )
    
    measurement_point = models.CharField(
        max_length=2,
        choices=MEASUREMENT_POINTS,
        verbose_name="Point de mesure"
    )
    
    # Valeur mesurée
    thickness_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name="Épaisseur (mm)"
    )
    
    # Type de mesure
    is_catchup = models.BooleanField(
        default=False,
        verbose_name="Mesure de rattrapage",
        help_text="Indique si c'est une mesure de rattrapage"
    )
    
    # Validation
    is_within_tolerance = models.BooleanField(
        default=True,
        verbose_name="Dans les tolérances"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Mesure d'épaisseur"
        verbose_name_plural = "Mesures d'épaisseur"
        ordering = ['roll', 'meter_position', 'measurement_point']
        indexes = [
            models.Index(fields=['roll', 'meter_position']),
            models.Index(fields=['roll', 'is_catchup']),
            models.Index(fields=['is_within_tolerance', '-created_at']),
        ]
    
    def __str__(self):
        catchup_str = " (rattrapage)" if self.is_catchup else ""
        return f"{self.roll.roll_id} - {self.measurement_point} à {self.meter_position}m: {self.thickness_value}mm{catchup_str}"


class Controls(models.Model):
    """Contrôles qualité effectués pendant la production."""
    
    # Relations
    shift = models.ForeignKey(
        'production.Shift',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='quality_controls',
        verbose_name="Poste"
    )
    
    session_key = models.CharField(
        max_length=255,
        verbose_name="Clé de session",
        help_text="Clé de session pour lier au shift en cours"
    )
    
    # Contrôles Micronnaire Gauche
    micrometer_left_1 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Gauche #1"
    )
    
    micrometer_left_2 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Gauche #2"
    )
    
    micrometer_left_3 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Gauche #3"
    )
    
    micrometer_left_avg = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Gauche Moyenne"
    )
    
    # Contrôles Micronnaire Droite
    micrometer_right_1 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Droite #1"
    )
    
    micrometer_right_2 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Droite #2"
    )
    
    micrometer_right_3 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Droite #3"
    )
    
    micrometer_right_avg = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Micronnaire Droite Moyenne"
    )
    
    # Extrait Sec
    dry_extract = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Extrait Sec (%)"
    )
    
    dry_extract_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Heure Extrait Sec"
    )
    
    # Masses Surfaciques Gauche
    surface_mass_gg = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Masse Surfacique GG (g/25cm²)"
    )
    
    surface_mass_gc = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Masse Surfacique GC (g/25cm²)"
    )
    
    surface_mass_left_avg = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Masse Surfacique Gauche Moyenne"
    )
    
    # Masses Surfaciques Droite
    surface_mass_dc = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Masse Surfacique DC (g/25cm²)"
    )
    
    surface_mass_dd = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Masse Surfacique DD (g/25cm²)"
    )
    
    surface_mass_right_avg = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Masse Surfacique Droite Moyenne"
    )
    
    # LOI
    loi_given = models.BooleanField(
        default=False,
        verbose_name="LOI donnée"
    )
    
    loi_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Heure LOI"
    )
    
    # Validation globale
    is_valid = models.BooleanField(
        default=True,
        verbose_name="Contrôles valides",
        help_text="Indique si tous les contrôles sont dans les tolérances"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date/heure du contrôle"
    )
    
    created_by = models.ForeignKey(
        'planification.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Contrôlé par"
    )
    
    class Meta:
        verbose_name = "Contrôle qualité"
        verbose_name_plural = "Contrôles qualité"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shift', '-created_at']),
            models.Index(fields=['session_key', '-created_at']),
            models.Index(fields=['is_valid', '-created_at']),
        ]
    
    def __str__(self):
        if self.shift:
            return f"Contrôles {self.shift.shift_id} - {self.created_at.strftime('%H:%M')}"
        return f"Contrôles session {self.session_key} - {self.created_at.strftime('%H:%M')}"