// Composant Alpine.js pour ordre de fabrication
function ordreFabrication() {
    return {
        // État
        ofEnCours: '',
        longueurCible: '',
        ofDecoupe: '',
        
        // États d'édition
        editingOF: false,
        editingLongueur: false,
        editingOFDecoupe: false,
        
        // Initialisation
        init() {
            // Charger les données de session
            this.loadFromSession();
            
            // Watchers pour sauvegarder automatiquement
            this.$watch('ofEnCours', () => {
                if (this.editingOF) {
                    this.saveToSession();
                }
                // Émettre un événement pour la sticky bar
                window.dispatchEvent(new CustomEvent('of-changed', {
                    detail: { ofEnCours: this.ofEnCours }
                }));
            });
            
            this.$watch('longueurCible', () => {
                if (this.editingLongueur) {
                    this.saveToSession();
                }
            });
            
            this.$watch('ofDecoupe', () => {
                if (this.editingOFDecoupe) {
                    this.saveToSession();
                }
            });
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                this.ofEnCours = window.sessionData.of_en_cours || '';
                this.longueurCible = window.sessionData.longueur_cible || '';
                this.ofDecoupe = window.sessionData.of_decoupe || '';
            }
        },
        
        // Sauvegarder en session via API
        async saveToSession() {
            const data = {
                of_en_cours: this.ofEnCours || null,
                longueur_cible: this.longueurCible || null,
                of_decoupe: this.ofDecoupe || null,
            };
            
            await api.saveToSession(data);
        },
        
        // Toggle édition OF en cours
        toggleEditOF() {
            this.editingOF = !this.editingOF;
            if (this.editingOF) {
                this.$nextTick(() => {
                    const select = document.querySelector('select[x-model="ofEnCours"]');
                    if (select) select.focus();
                });
            }
        },
        
        // Toggle édition Longueur cible
        toggleEditLongueur() {
            this.editingLongueur = !this.editingLongueur;
            if (this.editingLongueur) {
                this.$nextTick(() => {
                    const input = document.querySelector('input[x-model="longueurCible"]');
                    if (input) {
                        input.focus();
                        input.select(); // Sélectionner tout le contenu
                    }
                });
            }
        },
        
        // Toggle édition OF de découpe
        toggleEditOFDecoupe() {
            this.editingOFDecoupe = !this.editingOFDecoupe;
            if (this.editingOFDecoupe) {
                this.$nextTick(() => {
                    const select = document.querySelector('select[x-model="ofDecoupe"]');
                    if (select) select.focus();
                });
            }
        },
        
        
    };
}