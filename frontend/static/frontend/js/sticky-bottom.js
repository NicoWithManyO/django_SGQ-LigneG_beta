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
        cuttingOrder: '', // OF de découpe
        editingRollNumber: false,
        feltWidth: 1, // Largeur du feutre en mètres (par défaut 1m, à récupérer du profil)
        currentProfile: null,
        surfaceMassSpec: null,
        isRollConform: false, // Statut de conformité du rouleau
        hasAllThicknesses: false, // Toutes les épaisseurs sont remplies
        defectCount: 0, // Nombre de défauts
        nokCount: 0, // Nombre de NOK
        maxNok: 3, // Maximum de NOK autorisés (depuis le profil)
        sessionVersion: 0, // Pour forcer la mise à jour des getters
        saveDebounceTimer: null, // Timer pour débouncer la sauvegarde
        
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
                this.cuttingOrder = event.detail.cuttingOrder || '';
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
            
            // Recalculer l'ID quand le statut de conformité change
            this.$watch('isRollConform', () => {
                this.calculateRollId();
            });
            
            // Sauvegarder en session quand les valeurs changent
            this.$watch('tubeMass', () => {
                this.calculateNetMass();
                this.debouncedSaveToSession();
            });
            this.$watch('length', () => {
                this.calculateWeight();
                this.debouncedSaveToSession();
            });
            this.$watch('totalMass', () => {
                this.calculateNetMass();
                this.debouncedSaveToSession();
            });
            this.$watch('nextTubeMass', () => this.debouncedSaveToSession());
            
            // Écouter les événements blur sur les inputs de masse pour émettre le statut
            this.$nextTick(() => {
                // Input masse tube
                const tubeMassInput = this.$el.querySelector('input[x-model="tubeMass"]');
                if (tubeMassInput) {
                    tubeMassInput.addEventListener('blur', () => {
                        this.emitWeightStatusIfInvalid();
                    });
                }
                
                // Input masse totale
                const totalMassInput = this.$el.querySelector('input[x-model="totalMass"]');
                if (totalMassInput) {
                    totalMassInput.addEventListener('blur', () => {
                        this.emitWeightStatusIfInvalid();
                    });
                }
            });
            
            // Écouter les changements de session pour mise à jour live
            window.addEventListener('session-updated', (event) => {
                // Incrémenter sessionVersion pour forcer la mise à jour
                this.sessionVersion++;
            });
            
        },
        
        // Calculer l'ID du rouleau
        calculateRollId() {
            // Si le rouleau n'est pas conforme, utiliser l'OF de découpe
            if (!this.isRollConform && this.cuttingOrder) {
                this.rollId = RollCalculations.generateCuttingRollId(this.cuttingOrder, true) || '';
            } else {
                this.rollId = RollCalculations.generateRollId(this.currentFO, this.rollNumber) || '';
            }
        },
        
        // Charger les données du rouleau en cours
        loadCurrentRollData() {
            // Récupérer les données depuis la session
            if (window.sessionData) {
                this.currentFO = window.sessionData.of_en_cours || '';
                this.cuttingOrder = window.sessionData.of_decoupe || '';
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
                // Vérifier d'abord si la masse est invalide
                if (this.isMassInvalid()) {
                    window.dispatchEvent(new CustomEvent('weight-status-changed', {
                        detail: { 
                            weight: null,
                            isWeightNok: true
                        }
                    }));
                } else if (this.weight) {
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
        
        // Sauvegarder en session avec débounce
        debouncedSaveToSession() {
            // Annuler le timer précédent
            if (this.saveDebounceTimer) {
                clearTimeout(this.saveDebounceTimer);
            }
            
            // Créer un nouveau timer
            this.saveDebounceTimer = setTimeout(() => {
                this.saveToSession();
            }, 300); // Attendre 300ms après la dernière frappe
        },
        
        
        // Mettre à jour les données du rouleau
        updateRollData(data) {
            if (data.rollNumber !== undefined) this.rollNumber = data.rollNumber;
            if (data.rollId !== undefined) this.rollId = data.rollId;
            if (data.tubeMass !== undefined) this.tubeMass = data.tubeMass;
            if (data.length !== undefined) this.length = data.length;
            if (data.totalMass !== undefined) this.totalMass = data.totalMass;
            if (data.grammage !== undefined) this.weight = data.grammage;
            if (data.isConform !== undefined) this.isRollConform = data.isConform;
            if (data.hasAllThicknesses !== undefined) this.hasAllThicknesses = data.hasAllThicknesses;
            if (data.defectCount !== undefined) this.defectCount = data.defectCount;
            if (data.nokCount !== undefined) this.nokCount = data.nokCount;
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
            if (this.currentProfile && this.currentProfile.profilespecvalue_set) {
                // Chercher la spec de masse surfacique GLOBALE
                const surfaceMassSpec = this.currentProfile.profilespecvalue_set.find(spec => 
                    spec.spec_item.name.toLowerCase().includes('global') || 
                    spec.spec_item.display_name.toLowerCase().includes('globale')
                );
                
                
                if (surfaceMassSpec) {
                    this.surfaceMassSpec = {
                        min: parseFloat(surfaceMassSpec.value_min),
                        minAlert: parseFloat(surfaceMassSpec.value_min_alert),
                        nominal: parseFloat(surfaceMassSpec.value_nominal),
                        maxAlert: parseFloat(surfaceMassSpec.value_max_alert),
                        max: parseFloat(surfaceMassSpec.value_max)
                    };
                }
                
                // Chercher le nombre max de NOK autorisés
                const nokSpec = this.currentProfile.profilespecvalue_set.find(spec => 
                    spec.spec_item.name.toLowerCase().includes('nok') || 
                    spec.spec_item.display_name.toLowerCase().includes('nok')
                );
                
                if (nokSpec && nokSpec.value_max) {
                    this.maxNok = parseInt(nokSpec.value_max) || 3;
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
        },
        
        // Vérifier si on a un poste valide
        get hasValidShift() {
            // Utiliser sessionVersion pour forcer la réévaluation
            this.sessionVersion;
            
            // Vérifier les données minimum pour un poste
            return window.sessionData?.operator_id && 
                   window.sessionData?.shift_date && 
                   window.sessionData?.vacation;
        },
        
        // Vérifier si la masse est invalide (masse totale < masse tube)
        isMassInvalid() {
            if (!this.totalMass || !this.tubeMass) {
                return false;
            }
            
            const total = parseFloat(this.totalMass);
            const tube = parseFloat(this.tubeMass);
            
            if (isNaN(total) || isNaN(tube)) {
                return false;
            }
            
            return total < tube;
        },
        
        // Émettre le statut du grammage (sur blur uniquement)
        emitWeightStatusIfInvalid() {
            if (this.isMassInvalid()) {
                // Masse invalide → NOK
                window.dispatchEvent(new CustomEvent('weight-status-changed', {
                    detail: { 
                        weight: null,
                        isWeightNok: true
                    }
                }));
            } else if (!this.totalMass || !this.tubeMass || !this.netMass) {
                // Champs vides → pas de grammage donc pas NOK
                window.dispatchEvent(new CustomEvent('weight-status-changed', {
                    detail: { 
                        weight: null,
                        isWeightNok: false
                    }
                }));
            } else {
                // Masses valides → vérifier le grammage calculé
                const isNok = this.isWeightNok();
                window.dispatchEvent(new CustomEvent('weight-status-changed', {
                    detail: { 
                        weight: this.weight,
                        isWeightNok: isNok
                    }
                }));
            }
        },
        
        // Configuration du bouton de sauvegarde
        get saveButtonConfig() {
            // Pas de poste valide ou pas d'ID rouleau
            if (!this.hasValidShift || !this.rollId) {
                let tooltip = [];
                if (!this.hasValidShift) tooltip.push("Données du poste incomplètes");
                if (!this.rollId) tooltip.push("ID rouleau manquant");
                
                return { 
                    enabled: false, 
                    text: 'Sauvegarder Rouleau', 
                    class: 'btn-success', 
                    action: () => this.saveRoll(),
                    tooltip: tooltip.join(' | ')
                };
            }
            
            // Rouleau conforme
            if (this.isRollConform) {
                let tooltip = null;
                if (!this.hasAllThicknesses) {
                    tooltip = "Toutes les épaisseurs doivent être remplies";
                } else if (!this.weight) {
                    tooltip = "Masse totale requise pour calculer le grammage";
                }
                
                return { 
                    enabled: this.hasAllThicknesses && this.weight, 
                    text: `<i class="bi bi-check-circle me-1"></i>Sauvegarder ${this.rollId}`, 
                    class: 'btn-success', 
                    action: () => this.saveRoll(),
                    tooltip: tooltip
                };
            }
            
            // Rouleau non conforme
            return { 
                enabled: true, 
                text: '<i class="bi bi-scissors me-1"></i>Vers Découpe', 
                class: 'btn-warning', 
                action: () => this.sendToCutting(),
                tooltip: null
            };
        },
        
        // Sauvegarder le rouleau
        saveRoll() {
            // Préparer les données pour la modal
            const modalData = {
                isNonConform: false,
                rollId: this.rollId,
                length: this.length,
                netMass: this.netMass,
                weight: this.weight,
                weightClass: this.getWeightClass(),
                hasAllThicknesses: this.hasAllThicknesses,
                isWeightOk: !this.isWeightNok(),
                defectCount: this.defectCount,
                nokCount: this.nokCount,
                maxNok: this.maxNok
            };
            
            // Ouvrir la modal
            window.dispatchEvent(new CustomEvent('open-roll-save-modal', { 
                detail: modalData 
            }));
        },
        
        // Envoyer vers découpe
        sendToCutting() {
            // Préparer les données pour la modal
            const modalData = {
                isNonConform: true,
                rollId: RollCalculations.generateCuttingRollId(this.cuttingOrder, true), // Format d'affichage
                length: this.length,
                netMass: this.netMass,
                weight: this.weight,
                weightClass: this.getWeightClass(),
                hasAllThicknesses: this.hasAllThicknesses,
                isWeightOk: !this.isWeightNok(),
                defectCount: this.defectCount,
                nokCount: this.nokCount,
                maxNok: this.maxNok
            };
            
            // Ouvrir la modal
            window.dispatchEvent(new CustomEvent('open-roll-save-modal', { 
                detail: modalData 
            }));
        }
    };
}