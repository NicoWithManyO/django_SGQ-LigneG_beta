// Mixins partagés pour les composants Alpine.js

const sharedMixins = {
    // Mixin pour la sauvegarde automatique en session
    sessionSaver: {
        // Sauvegarder des données spécifiques en session
        async saveToSession(data) {
            try {
                await api.saveToSession(data);
            } catch (error) {
                console.error('Erreur sauvegarde session:', error);
            }
        },
        
        // Initialiser les watchers pour la sauvegarde automatique
        initAutoSave(fields) {
            // Grouper les watchers pour éviter les appels multiples
            let saveTimeout = null;
            
            // Créer un watcher pour chaque champ individuellement
            fields.forEach(field => {
                this.$watch(field, () => {
                    // Annuler la sauvegarde précédente si elle n'a pas encore eu lieu
                    if (saveTimeout) {
                        clearTimeout(saveTimeout);
                    }
                    
                    // Sauvegarder après un délai pour grouper les changements
                    saveTimeout = setTimeout(() => {
                        const dataToSave = {};
                        fields.forEach(f => {
                            if (this[f] !== undefined) {
                                dataToSave[f] = this[f];
                            }
                        });
                        this.saveToSession(dataToSave);
                    }, 300); // 300ms de délai
                });
            });
        }
    },
    
    // Mixin pour la validation numérique
    numericInput: {
        // Valider et formater une entrée numérique
        validateNumeric(value, options = {}) {
            const {
                allowNegative = false,
                maxDecimals = 2,
                min = null,
                max = null
            } = options;
            
            // Remplacer virgule par point pour le calcul
            let numValue = value.toString().replace(',', '.');
            
            // Vérifier si c'est un nombre valide
            if (!/^-?\d*\.?\d*$/.test(numValue)) {
                return null;
            }
            
            numValue = parseFloat(numValue);
            if (isNaN(numValue)) return null;
            
            // Appliquer les contraintes
            if (!allowNegative && numValue < 0) return null;
            if (min !== null && numValue < min) return min;
            if (max !== null && numValue > max) return max;
            
            // Limiter les décimales
            const factor = Math.pow(10, maxDecimals);
            numValue = Math.round(numValue * factor) / factor;
            
            return numValue;
        },
        
        // Formater pour l'affichage français
        formatNumeric(value) {
            if (value === null || value === undefined || value === '') return '';
            return value.toString().replace('.', ',');
        }
    }
};

// Exporter pour utilisation globale
window.sharedMixins = sharedMixins;