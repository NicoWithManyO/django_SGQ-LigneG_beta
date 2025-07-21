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
        weight: '',
        nextTubeMass: '',
        currentFO: '',
        editingRollNumber: false,
        feltWidth: 1, // Largeur du feutre en mètres (par défaut 1m, à récupérer du profil)
        currentProfile: null,
        surfaceMassSpec: null,
        
        // Initialisation
        init() {
            // Charger les données du rouleau en cours
            this.loadCurrentRollData();
            
            // Essayer de récupérer le profil actuel
            setTimeout(() => {
                const profileComponent = document.querySelector('[x-data*="profileManager"]');
                if (profileComponent && profileComponent.__x && profileComponent.__x.$data.selectedProfile) {
                    this.currentProfile = profileComponent.__x.$data.selectedProfile;
                    this.loadProfileSpecs();
                }
            }, 100);
            
            // Écouter les événements de mise à jour
            window.addEventListener('roll-updated', (event) => {
                this.updateRollData(event.detail);
            });
            
            // Écouter les changements d'OF depuis le composant ordre-fabrication
            window.addEventListener('of-changed', (event) => {
                this.currentFO = event.detail.currentFO || '';
                this.calculateRollId();
            });
            
            // Écouter les changements de profil
            window.addEventListener('profile-changed', (event) => {
                this.currentProfile = event.detail.profile;
                this.loadProfileSpecs();
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
                this.calculateWeight();
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
            this.rollId = RollCalculations.generateRollId(this.currentFO, this.rollNumber) || '';
        },
        
        // Charger les données du rouleau en cours
        loadCurrentRollData() {
            // Récupérer les données depuis la session
            if (window.sessionData) {
                this.currentFO = window.sessionData.of_en_cours || '';
                this.rollNumber = window.sessionData.roll_number || '';
                this.tubeMass = window.sessionData.tube_mass || '';
                this.length = window.sessionData.roll_length || '';
                this.totalMass = window.sessionData.total_mass || '';
                this.nextTubeMass = window.sessionData.next_tube_mass || '';
            }
            
            // Calculer l'ID initial et les valeurs
            this.calculateRollId();
            this.calculateNetMass();
            
            // Émettre l'événement initial après un court délai
            this.$nextTick(() => {
                if (this.weight) {
                    const isNok = this.isWeightNok();
                    window.dispatchEvent(new CustomEvent('weight-status-changed', {
                        detail: { 
                            weight: this.weight,
                            isWeightNok: isNok
                        }
                    }));
                }
            });
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
            
            await api.saveToSession(data);
        },
        
        
        // Mettre à jour les données du rouleau
        updateRollData(data) {
            if (data.rollNumber !== undefined) this.rollNumber = data.rollNumber;
            if (data.rollId !== undefined) this.rollId = data.rollId;
            if (data.tubeMass !== undefined) this.tubeMass = data.tubeMass;
            if (data.length !== undefined) this.length = data.length;
            if (data.totalMass !== undefined) this.totalMass = data.totalMass;
            if (data.grammage !== undefined) this.weight = data.grammage;
        },
        
        // Ouvrir la modal de données
        openDataModal() {
            // À FAIRE: Implémenter l'ouverture de la modal
            console.log('Ouvrir modal données incomplètes');
        },
        
        // Annuler le rouleau
        cancelRoll() {
            if (confirm('Êtes-vous sûr de vouloir annuler ce rouleau ?')) {
                // À FAIRE: Implémenter l'annulation
                console.log('Annuler le rouleau');
            }
        },
        
        // Supprimer le rouleau
        deleteRoll() {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce rouleau ?')) {
                // À FAIRE: Implémenter la suppression
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
                this.calculateWeight();
            } else {
                this.netMass = '';
                this.weight = '';
            }
        },
        
        // Calculer le grammage
        calculateWeight() {
            // D'abord calculer la masse nette si nécessaire
            let netMassValue = this.netMass ? parseFloat(this.netMass) : null;
            
            if (!netMassValue) {
                netMassValue = RollCalculations.calculateNetMass(this.totalMass, this.tubeMass);
            }
            
            const previousWeight = this.weight;
            
            if (netMassValue) {
                this.weight = RollCalculations.calculateGrammage(netMassValue, this.length, this.feltWidth) || '';
            } else {
                this.weight = '';
            }
            
            // Émettre un événement si le statut NOK a changé
            if (previousWeight !== this.weight) {
                const isNok = this.isWeightNok();
                window.dispatchEvent(new CustomEvent('weight-status-changed', {
                    detail: { 
                        weight: this.weight,
                        isWeightNok: isNok
                    }
                }));
            }
        },
        
        // Charger les spécifications du profil
        loadProfileSpecs() {
            console.log('loadProfileSpecs appelé, currentProfile:', this.currentProfile);
            if (this.currentProfile && this.currentProfile.profilespecvalue_set) {
                // Chercher la spec de masse surfacique GLOBALE
                const surfaceMassSpec = this.currentProfile.profilespecvalue_set.find(spec => 
                    spec.spec_item.name.toLowerCase().includes('global') || 
                    spec.spec_item.display_name.toLowerCase().includes('globale')
                );
                
                console.log('Spec masse surfacique trouvée:', surfaceMassSpec);
                
                if (surfaceMassSpec) {
                    this.surfaceMassSpec = {
                        min: parseFloat(surfaceMassSpec.value_min),
                        minAlert: parseFloat(surfaceMassSpec.value_min_alert),
                        nominal: parseFloat(surfaceMassSpec.value_nominal),
                        maxAlert: parseFloat(surfaceMassSpec.value_max_alert),
                        max: parseFloat(surfaceMassSpec.value_max)
                    };
                    console.log('surfaceMassSpec créé:', this.surfaceMassSpec);
                }
            }
        },
        
        // Obtenir la classe CSS pour le grammage
        getWeightClass() {
            if (!this.weight || !this.surfaceMassSpec) {
                return '';
            }
            
            // Extraire la valeur numérique
            const value = parseFloat(this.weight.toString().replace(' g/m²', ''));
            
            if (isNaN(value)) {
                return '';
            }
            
            const spec = this.surfaceMassSpec;
            
            // NOK si hors limites min/max
            if (value < spec.min || value > spec.max) {
                return 'text-danger';
            }
            
            // Alerte si hors limites d'alerte
            if (value < spec.minAlert || value > spec.maxAlert) {
                return 'text-warning';
            }
            
            // OK sinon
            return 'text-success';
        },
        
        // Vérifier si le grammage est NOK (hors seuils)
        isWeightNok() {
            if (!this.weight || !this.surfaceMassSpec) {
                // Pas de valeur ou pas de spec = considéré conforme
                return false;
            }
            
            // Extraire la valeur numérique
            const value = parseFloat(this.weight.toString().replace(' g/m²', ''));
            
            if (isNaN(value)) {
                // Valeur invalide = considéré conforme
                return false;
            }
            
            const spec = this.surfaceMassSpec;
            
            // NOK si hors limites min/max
            return value < spec.min || value > spec.max;
        }
    };
}