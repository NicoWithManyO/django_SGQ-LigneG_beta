// Composant Alpine.js pour ordre de fabrication
function productionOrder() {
    return {
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
            
            // Watchers pour sauvegarder automatiquement
            this.$watch('currentFO', () => {
                if (this.editingOF) {
                    this.saveToSession();
                }
                // Émettre un événement pour la sticky bar
                window.dispatchEvent(new CustomEvent('of-changed', {
                    detail: { currentFO: this.currentFO }
                }));
            });
            
            this.$watch('targetLength', () => {
                if (this.editingLength) {
                    this.saveToSession();
                }
                // Ne plus émettre l'événement ici - on le fera au blur
            });
            
            this.$watch('cuttingOrder', () => {
                if (this.editingCuttingOrder) {
                    this.saveToSession();
                }
            });
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                this.currentFO = window.sessionData.of_en_cours || '';
                this.targetLength = window.sessionData.longueur_cible || '';
                this.cuttingOrder = window.sessionData.of_decoupe || '';
                
                // Émettre l'événement initial pour le rouleau
                if (this.targetLength) {
                    window.dispatchEvent(new CustomEvent('target-length-changed', {
                        detail: { length: parseInt(this.targetLength) || 0 }
                    }));
                }
            }
        },
        
        // Sauvegarder en session via API
        async saveToSession() {
            const data = {
                of_en_cours: this.currentFO || null,
                longueur_cible: this.targetLength || null,
                of_decoupe: this.cuttingOrder || null,
            };
            
            await api.saveToSession(data);
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