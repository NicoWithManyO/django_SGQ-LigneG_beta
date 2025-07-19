// Composant Alpine.js pour la gestion du profil
function profile() {
    return {
        // État
        profiles: [],
        selectedProfileId: null,
        selectedProfile: null,
        modes: [],  // Changé en tableau pour les checkboxes
        availableModes: [], // Modes disponibles depuis l'API
        loading: false,
        updatingMode: false, // Pour éviter les appels multiples
        targetLength: window.sessionData?.target_length || 0,
        
        // Initialisation
        async init() {
            // Charger les profils disponibles
            await this.loadProfiles();
            
            // Charger les modes disponibles
            await this.loadModes();
            
            // Charger depuis la session
            this.loadFromSession();
            
            // Si un profil est sélectionné, charger ses détails
            if (this.selectedProfileId) {
                await this.loadProfileDetails();
                this.updateHeader();
            }
            
            // Watchers
            this.$watch('selectedProfileId', async () => {
                await this.loadProfileDetails();
                await this.setProfileActive();
                this.saveToSession();
                this.updateHeader();
            });
            
            this.$watch('modes', () => {
                if (!this.updatingMode) {
                    this.saveToSession();
                    this.updateHeader();
                }
            });
            
            // Écouter les changements de longueur cible pour recalculer l'estimation
            window.addEventListener('target-length-changed', (e) => {
                this.targetLength = e.detail.length;
                // Forcer le recalcul
                this.$refresh();
            });
        },
        
        // Charger la liste des profils
        async loadProfiles() {
            try {
                const response = await fetch('/api/profiles/');
                console.log('Response status:', response.status);
                if (response.ok) {
                    this.profiles = await response.json();
                    console.log('Profils chargés:', this.profiles);
                    
                    // Si pas de profil sélectionné, prendre le défaut
                    if (!this.selectedProfileId && this.profiles.length > 0) {
                        const defaultProfile = this.profiles.find(p => p.is_default);
                        this.selectedProfileId = defaultProfile ? defaultProfile.id : this.profiles[0].id;
                    }
                } else {
                    console.error('Erreur API:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Erreur chargement profils:', error);
            }
        },
        
        // Charger les détails du profil sélectionné
        async loadProfileDetails() {
            if (!this.selectedProfileId) return;
            
            this.loading = true;
            try {
                const response = await fetch(`/api/profiles/${this.selectedProfileId}/`);
                if (response.ok) {
                    this.selectedProfile = await response.json();
                }
            } catch (error) {
                console.error('Erreur chargement détails profil:', error);
            } finally {
                this.loading = false;
            }
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData?.selected_profile_id) {
                this.selectedProfileId = window.sessionData.selected_profile_id;
            }
            // Les modes sont maintenant chargés depuis la BDD dans loadModes()
        },
        
        // Sauvegarder dans la session
        async saveToSession() {
            try {
                await api.saveToSession({
                    selected_profile_id: this.selectedProfileId,
                    profile_modes: this.modes
                });
            } catch (error) {
                console.error('Erreur sauvegarde profil:', error);
            }
        },
        
        // Mettre à jour le header de l'accordéon
        updateHeader() {
            const profileName = this.selectedProfile?.name || '--';
            const modesText = this.modes.length > 0 ? this.modes.join(', ') : 'Aucun';
            const headerText = `Profil : ${profileName} (${modesText})`;
            
            // Mettre à jour le texte du bouton accordéon
            const button = document.querySelector('#accordionProfil .accordion-button');
            if (button) {
                button.innerHTML = `<i class="bi bi-graph-up me-2"></i> ${headerText}`;
            }
            
            // Émettre un événement pour notifier du changement
            window.dispatchEvent(new CustomEvent('profile-changed', {
                detail: {
                    profileId: this.selectedProfileId,
                    profile: this.selectedProfile,
                    modes: this.modes
                }
            }));
        },
        
        // Obtenir un paramètre par nom et catégorie
        getParamValue(name, isPrimary = true) {
            if (!this.selectedProfile?.profileparamvalue_set) return '--';
            
            const category = isPrimary ? 'Primaire' : 'Secondaire';
            const param = this.selectedProfile.profileparamvalue_set.find(p => 
                p.param_item.name === name && p.param_item.category === category
            );
            
            return param ? `${param.value}${param.param_item.unit || ''}` : '--';
        },
        
        // Obtenir une spécification par nom
        getSpecValue(name, field = 'nominal') {
            if (!this.selectedProfile?.profilespecvalue_set) return '--';
            
            const spec = this.selectedProfile.profilespecvalue_set.find(s => 
                s.spec_item.name === name
            );
            
            if (!spec) return '--';
            
            const fieldMap = {
                'min': 'value_min',
                'nominal': 'value_nominal',
                'max': 'value_max'
            };
            
            const value = spec[fieldMap[field]];
            return value !== null ? value : '--';
        },
        
        // Obtenir la classe CSS pour un badge de spécification
        getSpecBadgeClass(name, field) {
            const value = this.getSpecValue(name, field);
            if (value === '--' || field !== 'nominal') return '';
            
            // Pour l'instant, toujours vert pour les valeurs nominales
            return 'badge bg-success';
        },
        
        // Formater une valeur de spécification pour l'affichage
        formatSpecValue(spec, field) {
            const fieldMap = {
                'min': 'value_min',
                'min_alert': 'value_min_alert',
                'nominal': 'value_nominal',
                'max_alert': 'value_max_alert',
                'max': 'value_max'
            };
            
            const value = spec[fieldMap[field]];
            if (value === null || value === undefined) return '--';
            
            // Formater avec 2 décimales par défaut, 4 pour Masse Surfacique
            const isMasseSurfacique = spec.spec_item.display_name && 
                spec.spec_item.display_name.toLowerCase().includes('masse') && 
                spec.spec_item.display_name.toLowerCase().includes('surfacique');
            
            const decimals = isMasseSurfacique ? 4 : 2;
            const formattedValue = parseFloat(value).toFixed(decimals);
            
            return formattedValue;
        },
        
        // Formater le label d'une spécification avec l'unité
        formatSpecLabel(spec) {
            const unit = spec.spec_item.unit || '';
            return unit ? `${spec.spec_item.display_name} (${unit})` : spec.spec_item.display_name;
        },
        
        // Obtenir les catégories de paramètres uniques
        getParamCategories() {
            if (!this.selectedProfile?.profileparamvalue_set) return [];
            
            const categories = [...new Set(
                this.selectedProfile.profileparamvalue_set.map(p => p.param_item.category)
            )];
            
            return categories.sort();
        },
        
        // Obtenir les paramètres pour une catégorie
        getParamsForCategory(category) {
            if (!this.selectedProfile?.profileparamvalue_set) return [];
            
            return this.selectedProfile.profileparamvalue_set.filter(p => 
                p.param_item.category === category
            );
        },
        
        // Formater une valeur de paramètre
        formatParamValue(param) {
            if (!param.value) return '--';
            
            // Formater avec 2 décimales par défaut, 4 pour Masse Surfacique
            const isMasseSurfacique = param.param_item.display_name && 
                param.param_item.display_name.toLowerCase().includes('masse') && 
                param.param_item.display_name.toLowerCase().includes('surfacique');
            
            const decimals = isMasseSurfacique ? 4 : 2;
            const formattedValue = parseFloat(param.value).toFixed(decimals);
            
            return formattedValue;
        },
        
        // Formater le label d'un paramètre avec l'unité
        formatParamLabel(param) {
            const unit = param.param_item.unit || '';
            return unit ? `${param.param_item.display_name} (${unit})` : param.param_item.display_name;
        },
        
        // Charger les modes disponibles
        async loadModes() {
            try {
                const response = await fetch('/api/modes/');
                if (response.ok) {
                    this.availableModes = await response.json();
                    console.log('Modes chargés:', this.availableModes);
                    
                    // Initialiser les modes activés depuis la BDD
                    this.updatingMode = true;
                    this.modes = this.availableModes
                        .filter(mode => mode.is_enabled)
                        .map(mode => mode.name);
                    this.updatingMode = false;
                }
            } catch (error) {
                console.error('Erreur chargement modes:', error);
            }
        },
        
        // Marquer le profil comme actif dans la BDD
        async setProfileActive() {
            if (!this.selectedProfileId) return;
            
            try {
                const response = await fetch(`/api/profiles/${this.selectedProfileId}/set_active/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                    }
                });
                
                if (response.ok) {
                    console.log('Profil marqué comme actif');
                }
            } catch (error) {
                console.error('Erreur activation profil:', error);
            }
        },
        
        // Gérer le changement d'état d'un mode
        async toggleMode(modeName) {
            const mode = this.availableModes.find(m => m.name === modeName);
            if (!mode) return;
            
            try {
                const response = await fetch(`/api/modes/${mode.id}/toggle/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Mettre à jour l'état local du mode
                    mode.is_enabled = data.is_enabled;
                    console.log(`Mode ${modeName} : ${data.is_enabled ? 'activé' : 'désactivé'}`);
                }
            } catch (error) {
                console.error('Erreur toggle mode:', error);
            }
        },
        
        // Vérifier si c'est un paramètre de vitesse
        isSpeedParam(param) {
            const unit = param.param_item.unit || '';
            return unit.toLowerCase() === 'm/h';
        },
        
        // Convertir m/h en m/min
        convertToMPerMin(param) {
            if (!param.value || !this.isSpeedParam(param)) return '';
            
            const mPerHour = parseFloat(param.value);
            const mPerMin = mPerHour / 60;
            
            // Formater avec 2 décimales
            return `${mPerMin.toFixed(2)} m/min`;
        },
        
        // Vérifier si c'est le paramètre vitesse tapis
        isBeltSpeedParam(param) {
            const name = param.param_item.name || param.param_item.display_name || '';
            return name.toLowerCase().includes('tapis') && this.isSpeedParam(param);
        },
        
        // Obtenir le paramètre vitesse tapis
        getBeltSpeedParam() {
            if (!this.selectedProfile?.profileparamvalue_set) return null;
            
            return this.selectedProfile.profileparamvalue_set.find(param => 
                this.isBeltSpeedParam(param)
            );
        },
        
        // Calculer le temps de production pour la longueur cible
        calculateProductionTime(param) {
            if (!param || !param.value || !this.isBeltSpeedParam(param)) return '';
            
            // Utiliser la longueur cible stockée
            if (!this.targetLength) return '';
            
            const mPerHour = parseFloat(param.value);
            const hours = this.targetLength / mPerHour;
            const minutes = hours * 60;
            
            // Formater en heures et minutes
            if (minutes < 60) {
                return `~00:${minutes.toFixed(0).padStart(2, '0')} pour ${this.targetLength}m`;
            } else {
                const h = Math.floor(minutes / 60);
                const m = Math.round(minutes % 60);
                return `~${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} pour ${this.targetLength}m`;
            }
        }
    }
}