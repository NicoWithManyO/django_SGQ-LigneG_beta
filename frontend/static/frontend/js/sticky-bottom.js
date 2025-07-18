// Composant Alpine.js pour la sticky bottom bar
function stickyBottom() {
    return {
        // État
        rollNumber: '',
        rollId: '',
        tubeMass: '',
        length: '',
        totalMass: '',
        netMass: '',
        grammage: '',
        nextTubeMass: '',
        ofEnCours: '',
        editingRollNumber: false,
        feltWidth: 1, // Largeur du feutre en mètres (par défaut 1m, à récupérer du profil)
        
        // Initialisation
        init() {
            // Charger les données du rouleau en cours
            this.loadCurrentRollData();
            
            // Écouter les événements de mise à jour
            window.addEventListener('roll-updated', (event) => {
                this.updateRollData(event.detail);
            });
            
            // Écouter les changements d'OF depuis le composant ordre-fabrication
            window.addEventListener('of-changed', (event) => {
                this.ofEnCours = event.detail.ofEnCours || '';
                this.calculateRollId();
            });
            
            // Calculer l'ID rouleau quand le numéro change
            this.$watch('rollNumber', () => {
                this.calculateRollId();
                this.saveToSession();
            });
            
            // Sauvegarder en session quand les valeurs changent
            this.$watch('tubeMass', () => {
                this.calculateNetMass();
                this.saveToSession();
            });
            this.$watch('length', () => {
                this.calculateGrammage();
                this.saveToSession();
            });
            this.$watch('totalMass', () => {
                this.calculateNetMass();
                this.saveToSession();
            });
            this.$watch('nextTubeMass', () => this.saveToSession());
        },
        
        // Calculer l'ID du rouleau
        calculateRollId() {
            this.rollId = RollCalculations.generateRollId(this.ofEnCours, this.rollNumber) || '';
        },
        
        // Charger les données du rouleau en cours
        loadCurrentRollData() {
            // Récupérer les données depuis la session
            if (window.sessionData) {
                this.ofEnCours = window.sessionData.of_en_cours || '';
                this.rollNumber = window.sessionData.roll_number || '';
                this.tubeMass = window.sessionData.tube_mass || '';
                this.length = window.sessionData.roll_length || '';
                this.totalMass = window.sessionData.total_mass || '';
                this.nextTubeMass = window.sessionData.next_tube_mass || '';
            }
            
            // Calculer l'ID initial et les valeurs
            this.calculateRollId();
            this.calculateNetMass();
        },
        
        // Sauvegarder en session via API
        async saveToSession() {
            const data = {
                roll_number: this.rollNumber || null,
                tube_mass: this.tubeMass || null,
                roll_length: this.length || null,
                total_mass: this.totalMass || null,
                next_tube_mass: this.nextTubeMass || null,
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
        
        // Récupérer le token CSRF
        getCsrfToken() {
            const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
            return csrfInput ? csrfInput.value : '';
        },
        
        // Mettre à jour les données du rouleau
        updateRollData(data) {
            if (data.rollNumber !== undefined) this.rollNumber = data.rollNumber;
            if (data.rollId !== undefined) this.rollId = data.rollId;
            if (data.tubeMass !== undefined) this.tubeMass = data.tubeMass;
            if (data.length !== undefined) this.length = data.length;
            if (data.totalMass !== undefined) this.totalMass = data.totalMass;
            if (data.grammage !== undefined) this.grammage = data.grammage;
        },
        
        // Ouvrir la modal de données
        openDataModal() {
            // TODO: Implémenter l'ouverture de la modal
            console.log('Ouvrir modal données incomplètes');
        },
        
        // Annuler le rouleau
        cancelRoll() {
            if (confirm('Êtes-vous sûr de vouloir annuler ce rouleau ?')) {
                // TODO: Implémenter l'annulation
                console.log('Annuler le rouleau');
            }
        },
        
        // Supprimer le rouleau
        deleteRoll() {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce rouleau ?')) {
                // TODO: Implémenter la suppression
                console.log('Supprimer le rouleau');
            }
        },
        
        // Toggle édition du numéro de rouleau
        toggleEditRollNumber() {
            this.editingRollNumber = !this.editingRollNumber;
            if (this.editingRollNumber) {
                this.$nextTick(() => {
                    const input = document.querySelector('input[x-model="rollNumber"]');
                    if (input) {
                        input.focus();
                        input.select();
                    }
                });
            }
        },
        
        // Calculer la masse nette
        calculateNetMass() {
            const netMassValue = RollCalculations.calculateNetMass(this.totalMass, this.tubeMass);
            
            if (netMassValue !== null) {
                this.netMass = netMassValue.toString();
                this.calculateGrammage();
            } else {
                this.netMass = '';
                this.grammage = '';
            }
        },
        
        // Calculer le grammage
        calculateGrammage() {
            // D'abord calculer la masse nette si nécessaire
            let netMassValue = this.netMass ? parseFloat(this.netMass) : null;
            
            if (!netMassValue) {
                netMassValue = RollCalculations.calculateNetMass(this.totalMass, this.tubeMass);
            }
            
            if (netMassValue) {
                this.grammage = RollCalculations.calculateGrammage(netMassValue, this.length, this.feltWidth) || '';
            } else {
                this.grammage = '';
            }
        }
    };
}