// Composant Alpine.js pour ordre de fabrication
function productionOrder() {
    return {
        // Inclure les mixins partagés
        ...sharedMixins.sessionSaver,
        // État
        currentFO: '',
        targetLength: '',
        cuttingOrder: '',
        
        // États d'édition
        editingOF: false,
        editingLength: false,
        editingCuttingOrder: false,
        
        // Initialisation
        init() {
            // Charger les données de session
            this.loadFromSession();
            
            // Watchers individuels pour chaque champ
            this.$watch('currentFO', (value) => {
                console.log('currentFO changé:', value);
                // Émettre un événement pour la sticky bar
                window.dispatchEvent(new CustomEvent('of-changed', {
                    detail: { currentFO: value }
                }));
                // Sauvegarder
                this.saveToSession({ currentFO: value });
            });
            
            this.$watch('targetLength', (value) => {
                console.log('targetLength changé:', value);
                this.saveToSession({ targetLength: value });
            });
            
            this.$watch('cuttingOrder', (value) => {
                console.log('cuttingOrder changé:', value);
                this.saveToSession({ cuttingOrder: value });
            });
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                this.currentFO = window.sessionData.of_en_cours || '';
                this.targetLength = window.sessionData.target_length || '';
                this.cuttingOrder = window.sessionData.of_decoupe || '';
                
                // Émettre l'événement initial pour le rouleau
                if (this.targetLength) {
                    window.dispatchEvent(new CustomEvent('target-length-changed', {
                        detail: { length: parseInt(this.targetLength) || 0 }
                    }));
                }
            }
        },
        
        // Override pour mapper les noms de champs
        async saveToSession(data) {
            if (!data) {
                data = {
                    currentFO: this.currentFO,
                    targetLength: this.targetLength,
                    cuttingOrder: this.cuttingOrder
                };
            }
            
            console.log('Production Order - Données à sauver:', data); // Debug
            
            // Mapper les noms pour l'API
            const mappedData = {};
            const fieldMapping = {
                currentFO: 'of_en_cours',
                targetLength: 'target_length',
                cuttingOrder: 'of_decoupe'
            };
            
            Object.keys(data).forEach(key => {
                const mappedKey = fieldMapping[key] || key;
                mappedData[mappedKey] = data[key];
            });
            
            console.log('Production Order - Données mappées:', mappedData); // Debug
            
            try {
                await api.saveToSession(mappedData);
                console.log('Production Order - Sauvegarde réussie'); // Debug
            } catch (error) {
                console.error('Production Order - Erreur sauvegarde:', error);
            }
        },
        
        // Toggle édition OF en cours
        toggleEditOF() {
            this.editingOF = !this.editingOF;
            if (this.editingOF) {
                this.$nextTick(() => {
                    const select = document.querySelector('select[x-model="currentFO"]');
                    if (select) select.focus();
                });
            }
        },
        
        // Toggle édition Longueur cible
        toggleEditLength() {
            this.editingLength = !this.editingLength;
            if (this.editingLength) {
                this.$nextTick(() => {
                    const input = document.querySelector('input[x-model="targetLength"]');
                    if (input) {
                        input.focus();
                        input.select(); // Sélectionner tout le contenu
                    }
                });
            }
        },
        
        // Toggle édition OF de découpe
        toggleEditCuttingOrder() {
            this.editingCuttingOrder = !this.editingCuttingOrder;
            if (this.editingCuttingOrder) {
                this.$nextTick(() => {
                    const select = document.querySelector('select[x-model="cuttingOrder"]');
                    if (select) select.focus();
                });
            }
        },
        
        // Gérer la fin d'édition de la longueur cible
        handleLengthBlur() {
            // Émettre l'événement pour mettre à jour le rouleau
            window.dispatchEvent(new CustomEvent('target-length-changed', {
                detail: { length: parseInt(this.targetLength) || 0 }
            }));
        }
        
    };
}