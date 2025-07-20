// Module de validation pour les inputs numériques
const numericInputValidator = {
    // Initialiser la validation sur un input
    init(element) {
        // Validation au clavier
        element.addEventListener('keydown', (e) => this.validateKeydown(e));
        
        // Conversion virgule en point à la saisie
        element.addEventListener('input', (e) => this.handleInput(e));
        
        // Formatage au blur si nécessaire
        element.addEventListener('blur', (e) => this.handleBlur(e));
        
        // Sélectionner tout le contenu au clic
        element.addEventListener('click', (e) => e.target.select());
        
        // Sélectionner tout le contenu au focus (pour Tab)
        element.addEventListener('focus', (e) => e.target.select());
    },
    
    // Valider les touches pressées
    validateKeydown(event) {
        // Autoriser les raccourcis clavier (Ctrl+C, Ctrl+V, etc.)
        if (event.ctrlKey || event.metaKey) {
            return true;
        }
        
        // Autoriser les touches de navigation et d'édition
        const navigationKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (navigationKeys.includes(event.key)) {
            return true;
        }
        
        // Autoriser uniquement les chiffres, le point et la virgule
        const allowedChars = /^[0-9.,]$/;
        if (!allowedChars.test(event.key)) {
            event.preventDefault();
            return false;
        }
        
        // Empêcher plusieurs séparateurs décimaux
        const currentValue = event.target.value;
        if ((event.key === '.' || event.key === ',') && (currentValue.includes('.') || currentValue.includes(','))) {
            event.preventDefault();
            return false;
        }
    },
    
    // Gérer la saisie et convertir virgule en point
    handleInput(event) {
        let value = event.target.value;
        
        // Remplacer TOUTES les virgules par des points
        value = value.replace(/,/g, '.');
        
        // Mettre à jour la valeur si elle a changé
        if (value !== event.target.value) {
            event.target.value = value;
            
            // Déclencher un événement input pour qu'Alpine.js mette à jour le modèle
            event.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },
    
    // Gérer le blur (optionnel, pour formatage)
    handleBlur(event) {
        const value = event.target.value;
        
        // Nettoyer les espaces
        event.target.value = value.trim();
        
        // Optionnel : vérifier que c'est un nombre valide
        if (value && isNaN(parseFloat(value))) {
            event.target.value = '';
        }
    }
};

// Fonction helper pour initialiser facilement
window.initNumericInput = function(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => numericInputValidator.init(el));
};

// Exporter pour Alpine.js
window.numericInputValidator = numericInputValidator;