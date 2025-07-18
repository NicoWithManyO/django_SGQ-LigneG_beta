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
            
            // Watchers pour sauvegarder et reverrouiller automatiquement
            this.$watch('ofEnCours', () => {
                if (this.editingOF) {
                    // Sauvegarder et reverrouiller après modification
                    this.saveToSession();
                    this.$nextTick(() => {
                        this.editingOF = false;
                    });
                }
            });
            // Pas de watcher automatique pour longueurCible - on sauvegarde sur blur/enter
            this.$watch('ofDecoupe', () => {
                if (this.editingOFDecoupe) {
                    // Sauvegarder et reverrouiller après modification
                    this.saveToSession();
                    this.$nextTick(() => {
                        this.editingOFDecoupe = false;
                    });
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
            
            try {
                const response = await fetch('/api/session/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken()
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    console.error('Erreur lors de la sauvegarde en session');
                }
            } catch (error) {
                console.error('Erreur réseau:', error);
            }
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
                    if (input) input.focus();
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
        
        // Sauvegarder et fermer le champ longueur
        saveAndCloseLongueur() {
            this.saveToSession();
            this.editingLongueur = false;
        },
        
        // Récupérer le token CSRF
        getCsrfToken() {
            const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
            return csrfInput ? csrfInput.value : '';
        }
    };
}