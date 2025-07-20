// Module de formatage pour le contrôle qualité
const qualityControlFormatters = {
    // Formater une valeur de micrométrie (mg/min)
    formatMicrometrie(value) {
        if (value === null || value === '') return '';
        return parseFloat(value).toFixed(0);
    },
    
    // Formater une valeur de masse surfacique (g/25cm²)
    formatMasseSurfacique(value) {
        if (value === null || value === '') return '';
        return parseFloat(value).toFixed(4);
    },
    
    // Formater une valeur d'extrait sec (%)
    formatExtraitSec(value) {
        if (value === null || value === '') return '';
        return parseFloat(value).toFixed(2);
    },
    
    // Formater une moyenne avec le bon nombre de décimales
    formatAverage(value, type) {
        if (value === null) return '--';
        
        switch(type) {
            case 'micrometry':
                return value.toFixed(2);
            case 'surfaceMass':
                return value.toFixed(4);
            case 'dryExtract':
                return value.toFixed(2);
            default:
                return value.toFixed(2);
        }
    },
    
    // Obtenir la classe CSS selon le statut de validation
    getStatusClass(status) {
        switch(status) {
            case 'success':
                return 'text-success';
            case 'warning':
                return 'text-warning';
            case 'error':
                return 'text-danger';
            case 'empty':
                return 'text-muted';
            default:
                return '';
        }
    },
    
    // Obtenir la classe pour le badge QC
    getQCBadgeClass(status) {
        // Toujours pending au démarrage
        if (!status || status === '') {
            return 'badge bg-secondary';
        }
        
        switch(status) {
            case 'passed':
                return 'badge bg-success';
            case 'failed':
                return 'badge bg-danger';
            case 'pending':
                return 'badge bg-secondary';
            default:
                return 'badge bg-secondary';
        }
    },
    
    // Obtenir le texte du badge QC
    getQCBadgeText(status) {
        // Toujours pending au démarrage
        if (!status || status === '') {
            return 'QC Pending';
        }
        
        switch(status) {
            case 'passed':
                return 'QC Passed';
            case 'failed':
                return 'QC Failed';
            case 'pending':
                return 'QC Pending';
            default:
                return 'QC Pending';
        }
    },
    
    // Obtenir l'icône selon le statut
    getStatusIcon(status) {
        // Toujours pending au démarrage
        if (!status || status === '') {
            return 'bi-clock-fill';
        }
        
        switch(status) {
            case 'passed':
                return 'bi-check-circle-fill';
            case 'failed':
                return 'bi-x-circle-fill';
            case 'pending':
                return 'bi-clock-fill';
            default:
                return 'bi-clock-fill';
        }
    }
};

// Exporter pour utilisation
window.qualityControlFormatters = qualityControlFormatters;