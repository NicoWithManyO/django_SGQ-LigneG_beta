from django.contrib import admin
from django.utils.html import format_html
from .models import Shift, Roll, CurrentProfile


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    """Administration des postes de production."""
    
    list_display = ['shift_id', 'date', 'vacation', 'operator', 
                    'total_length', 'availability_time', 'checklist_signed']
    list_filter = ['vacation', 'date', 'checklist_signed', 'started_at_beginning', 'started_at_end']
    search_fields = ['shift_id', 'operator__first_name', 'operator__last_name']
    date_hierarchy = 'date'
    ordering = ['-date', 'vacation']
    
    fieldsets = (
        ('Identification', {
            'fields': ('date', 'operator', 'vacation')
        }),
        ('Horaires', {
            'fields': ('start_time', 'end_time', 'availability_time', 'lost_time')
        }),
        ('Production', {
            'fields': ('total_length', 'ok_length', 'nok_length', 'raw_waste_length')
        }),
        ('Moyennes du poste', {
            'fields': ('avg_thickness_left_shift', 'avg_thickness_right_shift', 'avg_grammage_shift'),
            'classes': ('collapse',)
        }),
        ('État machine', {
            'fields': (
                ('started_at_beginning', 'meter_reading_start'),
                ('started_at_end', 'meter_reading_end')
            ),
            'classes': ('collapse',)
        }),
        ('Check-list', {
            'fields': ('checklist_signed', 'checklist_signed_time')
        }),
        ('Commentaires', {
            'fields': ('operator_comments',),
            'classes': ('wide',)
        }),
    )
    
    readonly_fields = ['shift_id', 'availability_time', 'lost_time', 'raw_waste_length',
                      'avg_thickness_left_shift', 'avg_thickness_right_shift', 'avg_grammage_shift']
    
    inlines = []  # Pour ajouter les rolls en ligne si nécessaire


@admin.register(Roll)
class RollAdmin(admin.ModelAdmin):
    """Administration des rouleaux."""
    
    list_display = ['roll_id', 'shift', 'fabrication_order', 'length', 'grammage_display',
                    'status_display', 'destination', 'has_defects', 'created_at']
    list_filter = ['status', 'destination', 'has_blocking_defects', 'has_thickness_issues', 
                   'created_at', 'fabrication_order']
    search_fields = ['roll_id', 'shift__shift_id', 'fabrication_order__order_number']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Identification', {
            'fields': ('roll_id', 'shift', 'fabrication_order', 'roll_number')
        }),
        ('Données de production', {
            'fields': ('length', 'tube_mass', 'total_mass', 'net_mass', 'grammage_calc')
        }),
        ('Statut et destination', {
            'fields': ('status', 'destination', 'has_blocking_defects', 'has_thickness_issues')
        }),
        ('Épaisseurs moyennes', {
            'fields': ('avg_thickness_left', 'avg_thickness_right'),
            'classes': ('collapse',)
        }),
        ('Traçabilité', {
            'fields': ('shift_id_str', 'session_key'),
            'classes': ('collapse',)
        }),
        ('Commentaire', {
            'fields': ('comment',),
            'classes': ('wide',)
        }),
    )
    
    readonly_fields = ['roll_id', 'net_mass', 'grammage_calc']
    
    def status_display(self, obj):
        """Affiche le statut avec couleur."""
        if obj.status == 'CONFORME':
            color = 'green'
            icon = '✓'
        else:
            color = 'red'
            icon = '✗'
        return format_html('<span style="color: {};">{} {}</span>', 
                          color, icon, obj.get_status_display())
    status_display.short_description = "Statut"
    
    def grammage_display(self, obj):
        """Affiche le grammage."""
        if obj.grammage_calc:
            return f"{obj.grammage_calc} g/m"
        return "-"
    grammage_display.short_description = "Grammage"
    
    def has_defects(self, obj):
        """Indique si le rouleau a des défauts."""
        return obj.defects.exists()
    has_defects.boolean = True
    has_defects.short_description = "Défauts"
    
    actions = ['force_to_cutting', 'set_as_conform']
    
    def force_to_cutting(self, request, queryset):
        """Force les rouleaux sélectionnés vers la découpe."""
        count = queryset.filter(status='CONFORME').update(destination='DECOUPE_FORCEE')
        if count:
            self.message_user(request, f"{count} rouleau(x) forcé(s) vers la découpe.")
    force_to_cutting.short_description = "Forcer vers la découpe"
    
    def set_as_conform(self, request, queryset):
        """Marque les rouleaux comme conformes."""
        count = queryset.update(status='CONFORME', destination='PRODUCTION',
                               has_blocking_defects=False, has_thickness_issues=False)
        if count:
            self.message_user(request, f"{count} rouleau(x) marqué(s) conforme(s).")
    set_as_conform.short_description = "Marquer comme conforme"


@admin.register(CurrentProfile)
class CurrentProfileAdmin(admin.ModelAdmin):
    """Administration du profil actuel."""
    
    list_display = ['profile', 'selected_at']
    fields = ['profile', 'selected_at']
    readonly_fields = ['selected_at']
    
    def has_add_permission(self, request):
        """Un seul profil actuel peut exister."""
        return not CurrentProfile.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Empêche la suppression."""
        return False