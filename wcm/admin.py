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
    
    def has_add_permission(self, request):
        """Empêche l'ajout manuel."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Empêche la suppression."""
        return False
    
    def percentage_display(self, obj):
        """Affiche le pourcentage."""
        percentages = MoodCounter.get_percentages()
        percentage = percentages.get(obj.mood_type, 0)
        return f"{percentage}%"
    percentage_display.short_description = "Pourcentage"
    
    actions = ['reset_counters']
    
    def reset_counters(self, request, queryset):
        """Réinitialise les compteurs sélectionnés."""
        count = queryset.update(count=0)
        self.message_user(request, f"{count} compteur(s) réinitialisé(s).")
    reset_counters.short_description = "Réinitialiser les compteurs"






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
    
    list_display = ['shift', 'item', 'response_display', 'responded_by', 'created_at']
    list_filter = ['response', 'created_at', 'item__template']
    search_fields = ['shift__shift_id', 'item__text', 'comment']
    date_hierarchy = 'created_at'
    ordering = ['shift', 'item__order']
    autocomplete_fields = ['shift']
    
    fieldsets = (
        ('Identification', {
            'fields': ('shift', 'item')
        }),
        ('Réponse', {
            'fields': ('response', 'comment', 'responded_by')
        }),
    )
    
    def response_display(self, obj):
        """Affiche la réponse avec couleur."""
        colors = {
            'ok': 'green',
            'nok': 'red',
            'na': 'gray'
        }
        color = colors.get(obj.response, 'black')
        return format_html('<span style="color: {};">{}</span>', 
                          color, obj.get_response_display())
    response_display.short_description = "Réponse"