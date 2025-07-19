// ===== UTILITAIRES COMMUNS =====
// Fonctions utilitaires partagées entre les composants

const utils = {
    // Récupérer le token CSRF pour les requêtes
    getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    },
    
    // Formater une date/heure en format français
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR');
    },
    
    // Formater une heure seule
    formatTime(timeString) {
        if (!timeString) return '';
        const date = new Date(timeString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    },
    
    // Débounce pour éviter les appels API trop fréquents
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export pour utilisation dans d'autres fichiers
window.utils = utils;