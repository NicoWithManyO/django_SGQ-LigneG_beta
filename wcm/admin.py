from django.contrib import admin
from django.utils.html import format_html
from .models import (Mode, MoodCounter, 
                     LostTimeEntry, ChecklistResponse)



@admin.register(Mode)
class ModeAdmin(admin.ModelAdmin):
    """Administration des modes de fonctionnement."""
    
    list_display = ['name', 'enabled_display', 'is_active']
    list_filter = ['is_enabled', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Identification', {
            'fields': ('name', 'description')
        }),
        ('État', {
            'fields': ('is_enabled', 'is_active')
        }),
    )
    
    actions = ['enable_modes', 'disable_modes']
    
    def enabled_display(self, obj):
        """Affiche l'état activé avec couleur."""
        if obj.is_enabled:
            return format_html('<span style="color: green;">✓ Activé</span>')
        else:
            return format_html('<span style="color: gray;">○ Désactivé</span>')
    enabled_display.short_description = "État"
    
    def enable_modes(self, request, queryset):
        """Active les modes sélectionnés."""
        for mode in queryset:
            mode.enable()
        self.message_user(request, f"{queryset.count()} mode(s) activé(s).")
    enable_modes.short_description = "Activer les modes sélectionnés"
    
    def disable_modes(self, request, queryset):
        """Désactive les modes sélectionnés."""
        for mode in queryset:
            mode.disable()
        self.message_user(request, f"{queryset.count()} mode(s) désactivé(s).")
    disable_modes.short_description = "Désactiver les modes sélectionnés"


@admin.register(MoodCounter)
class MoodCounterAdmin(admin.ModelAdmin):
    """Administration des compteurs d'humeur."""
    
    list_display = ['mood_type', 'count', 'percentage_display', 'updated_at']
    ordering = ['mood_type']
    readonly_fields = ['mood_type', 'count', 'updated_at']
    
    def has_add_permission(self, request):
        """Empêche l'ajout manuel."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Empêche la suppression."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Empêche la modification directe."""
        return False
    
    def percentage_display(self, obj):
        """Affiche le pourcentage."""
        percentages = MoodCounter.get_percentages()
        percentage = percentages.get(obj.mood_type, 0)
        return f"{percentage}%"
    percentage_display.short_description = "Pourcentage"






@admin.register(LostTimeEntry)
class LostTimeEntryAdmin(admin.ModelAdmin):
    """Administration des temps d'arrêt."""
    
    list_display = ['shift_display', 'reason_display', 'duration', 'created_at', 'created_by']
    list_filter = ['reason__category', 'created_at']
    search_fields = ['shift__shift_id', 'reason__name', 'motif', 'comment']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    autocomplete_fields = ['shift', 'reason']
    
    fieldsets = (
        ('Identification', {
            'fields': ('shift', 'session_key')
        }),
        ('Arrêt', {
            'fields': ('reason', 'motif', 'duration')
        }),
        ('Détails', {
            'fields': ('comment', 'created_by'),
            'classes': ('wide',)
        }),
    )
    
    def shift_display(self, obj):
        """Affiche le shift ou la session."""
        if obj.shift:
            return obj.shift.shift_id
        return f"Session {obj.session_key[:8]}..." if obj.session_key else "-"
    shift_display.short_description = "Poste/Session"
    
    def reason_display(self, obj):
        """Affiche le motif."""
        if obj.reason:
            return obj.reason.name
        return obj.motif or "-"
    reason_display.short_description = "Motif"



@admin.register(ChecklistResponse)
class ChecklistResponseAdmin(admin.ModelAdmin):
    """Administration des réponses aux check-lists."""
    
    list_display = ['shift', 'operator_signature', 'management_visa', 'created_at']
    list_filter = ['created_at', 'management_visa']
    search_fields = ['shift__shift_id', 'operator_signature', 'management_visa']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    autocomplete_fields = ['shift']
    readonly_fields = ['created_at', 'updated_at', 'get_responses_display', 
                      'operator', 'operator_signature_date']
    
    fieldsets = (
        ('Identification', {
            'fields': ('shift',)
        }),
        ('Signature opérateur', {
            'fields': (
                'operator',
                'operator_signature', 
                'operator_signature_date',
            ),
            'description': 'Signature automatique lors de la validation de la checklist'
        }),
        ('Réponses', {
            'fields': ('get_responses_display',),
            'classes': ('wide',)
        }),
        ('Visa management', {
            'fields': (
                'management_visa',
                'management_visa_date'
            ),
            'description': 'À remplir par le management'
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_responses_display(self, obj):
        """Affiche les réponses comme des champs readonly."""
        if not obj or not obj.responses:
            return "Aucune réponse"
            
        from catalog.models import WcmChecklistItem
        from django.utils.safestring import mark_safe
        
        html = '<table class="table table-bordered" style="width:100%">'
        html += '<thead><tr><th>Item</th><th>Réponse</th></tr></thead><tbody>'
        
        for item_id, response in obj.responses.items():
            try:
                item = WcmChecklistItem.objects.get(id=item_id)
                item_name = item.text
            except WcmChecklistItem.DoesNotExist:
                item_name = f"Item #{item_id} (supprimé)"
            
            # Couleur selon la réponse
            colors = {
                'ok': 'green',
                'nok': 'red',
                'na': 'gray'
            }
            color = colors.get(response, 'black')
            
            html += f'<tr>'
            html += f'<td style="width:70%">{item_name}</td>'
            html += f'<td style="color:{color};font-weight:bold;">{response.upper()}</td>'
            html += f'</tr>'
        
        html += '</tbody></table>'
        return mark_safe(html)
    
    get_responses_display.short_description = "Réponses checklist"
    
    def save_model(self, request, obj, form, change):
        """Sauvegarde personnalisée pour gérer le visa management."""
        if change:  # Modification d'un objet existant
            # Si un visa management est ajouté et qu'il n'y a pas de date
            if obj.management_visa and not obj.management_visa_date:
                from django.utils import timezone
                obj.management_visa_date = timezone.now()
        
        super().save_model(request, obj, form, change)