// Composant Alpine.js pour le contrôle qualité
function qualityControl() {
    return {
        // État
        micrometry: {
            left: [null, null, null],
            right: [null, null, null],
            averageLeft: null,
            averageRight: null
        },
        surfaceMass: {
            leftLeft: null,
            leftCenter: null,
            rightCenter: null,
            rightRight: null,
            averageLeft: null,
            averageRight: null
        },
        dryExtract: {
            value: null,
            sample: null,  // null = non défini, true/false = défini par l'utilisateur
            timestamp: null,
            loiTimestamp: null
        },
        qcStatus: 'pending',
        currentProfile: null,
        thresholds: null,
        
        // Initialisation
        init() {
            // S'assurer que le statut initial est bien pending
            this.qcStatus = 'pending';
            
            // Charger depuis la session
            this.loadFromSession();
            
            // Charger les seuils par défaut d'abord
            this.thresholds = qualityControlBusinessLogic.defaultThresholds;
            
            // Déplacer le badge QC vers la zone des badges
            this.moveQCBadge();
            
            // Essayer de récupérer le profil actuel s'il existe
            // Utiliser un timeout pour s'assurer que le profileManager est initialisé
            setTimeout(() => {
                const profileComponent = document.querySelector('[x-data*="profileManager"]');
                if (profileComponent && profileComponent.__x && profileComponent.__x.$data.selectedProfile) {
                    this.currentProfile = profileComponent.__x.$data.selectedProfile;
                    this.loadThresholdsFromProfile();
                    // Ne mettre à jour le statut que si on a des données
                    if (this.micrometry && this.surfaceMass && this.dryExtract) {
                        this.updateStatus();
                    }
                }
                
                // Toujours émettre le statut actuel au démarrage
                window.dispatchEvent(new CustomEvent('quality-control-updated', {
                    detail: {
                        status: this.qcStatus,
                        data: {
                            micrometry: this.micrometry,
                            surfaceMass: this.surfaceMass,
                            dryExtract: this.dryExtract
                        }
                    }
                }));
            }, 100);
            
            // Écouter les changements de profil
            window.addEventListener('profile-changed', (e) => {
                this.currentProfile = e.detail.profile;
                this.loadThresholdsFromProfile();
                // Ne mettre à jour le statut que si on a des données
                if (this.micrometry && this.surfaceMass && this.dryExtract) {
                    this.updateStatus();
                }
            });
        },
        
        // Déplacer le badge QC vers la zone des badges
        moveQCBadge() {
            setTimeout(() => {
                const badge = document.getElementById('qc-badge');
                const container = document.getElementById('qc-badge-container');
                if (badge && container) {
                    badge.style.display = '';
                    container.appendChild(badge);
                }
            }, 50);
        },
        
        // Charger depuis la session
        loadFromSession() {
            const data = window.sessionData?.quality_control;
            if (data) {
                // Charger les micrométries
                if (data.micrometry) {
                    this.micrometry = {
                        left: data.micrometry.left || [null, null, null],
                        right: data.micrometry.right || [null, null, null],
                        averageLeft: data.micrometry.averageLeft || null,
                        averageRight: data.micrometry.averageRight || null
                    };
                }
                
                // Charger les masses surfaciques
                if (data.surfaceMass) {
                    this.surfaceMass = {
                        leftLeft: data.surfaceMass.leftLeft !== undefined ? data.surfaceMass.leftLeft : null,
                        leftCenter: data.surfaceMass.leftCenter !== undefined ? data.surfaceMass.leftCenter : null,
                        rightCenter: data.surfaceMass.rightCenter !== undefined ? data.surfaceMass.rightCenter : null,
                        rightRight: data.surfaceMass.rightRight !== undefined ? data.surfaceMass.rightRight : null,
                        averageLeft: data.surfaceMass.averageLeft || null,
                        averageRight: data.surfaceMass.averageRight || null
                    };
                }
                
                // Charger l'extrait sec
                if (data.dryExtract) {
                    this.dryExtract = {
                        value: data.dryExtract.value !== undefined ? data.dryExtract.value : null,
                        sample: data.dryExtract.sample !== undefined ? data.dryExtract.sample : null,
                        timestamp: data.dryExtract.timestamp || null,
                        loiTimestamp: data.dryExtract.loiTimestamp || null
                    };
                }
                
                // Ne mettre à jour les calculs que si on a effectivement chargé TOUTES les données
                if (data.micrometry && data.surfaceMass && data.dryExtract) {
                    this.updateAllCalculations();
                }
            }
        },
        
        // Sauvegarder dans la session
        async saveToSession() {
            try {
                const qcData = {
                    quality_control: {
                        micrometry: this.micrometry,
                        surfaceMass: this.surfaceMass,
                        dryExtract: this.dryExtract,
                        status: this.qcStatus
                    }
                };
                
                await api.saveToSession(qcData);
                
                // Mettre à jour window.sessionData immédiatement
                if (!window.sessionData) {
                    window.sessionData = {};
                }
                window.sessionData.quality_control = qcData.quality_control;
                
            } catch (error) {
                console.error('Erreur sauvegarde contrôle qualité:', error);
            }
        },
        
        // Charger les seuils depuis le profil
        loadThresholdsFromProfile() {
            if (!this.currentProfile || !this.currentProfile.profilespecvalue_set) {
                this.thresholds = qualityControlBusinessLogic.defaultThresholds;
                console.log('Utilisation des seuils par défaut:', this.thresholds);
                return;
            }
            
            // Extraire les seuils depuis le profil
            const thresholds = {
                micrometry: { ...qualityControlBusinessLogic.defaultThresholds.micrometry },
                surfaceMass: { ...qualityControlBusinessLogic.defaultThresholds.surfaceMass },
                dryExtract: { ...qualityControlBusinessLogic.defaultThresholds.dryExtract }
            };
            
            // Parcourir les spec values du profil
            this.currentProfile.profilespecvalue_set.forEach(spec => {
                const specName = spec.spec_item.name.toLowerCase();
                
                
                // Micronnaire (les noms dans la DB sont en français malheureusement)
                if (specName === 'micronaire') {
                    if (spec.value_min !== null && spec.value_min !== '') {
                        const val = parseFloat(spec.value_min);
                        if (!isNaN(val)) thresholds.micrometry.min = val;
                    }
                    if (spec.value_min_alert !== null && spec.value_min_alert !== '') {
                        const val = parseFloat(spec.value_min_alert);
                        if (!isNaN(val)) thresholds.micrometry.minAlert = val;
                    }
                    if (spec.value_nominal !== null && spec.value_nominal !== '') {
                        const val = parseFloat(spec.value_nominal);
                        if (!isNaN(val)) thresholds.micrometry.nominal = val;
                    }
                    if (spec.value_max_alert !== null && spec.value_max_alert !== '') {
                        const val = parseFloat(spec.value_max_alert);
                        if (!isNaN(val)) thresholds.micrometry.maxAlert = val;
                    }
                    if (spec.value_max !== null && spec.value_max !== '') {
                        const val = parseFloat(spec.value_max);
                        if (!isNaN(val)) thresholds.micrometry.max = val;
                    }
                }
                
                // Masse surfacique (nom en français dans la DB)
                if (specName === 'masse surfacique') {
                    if (spec.value_min !== null && spec.value_min !== '') {
                        const val = parseFloat(spec.value_min);
                        if (!isNaN(val)) thresholds.surfaceMass.min = val;
                    }
                    if (spec.value_min_alert !== null && spec.value_min_alert !== '') {
                        const val = parseFloat(spec.value_min_alert);
                        if (!isNaN(val)) thresholds.surfaceMass.minAlert = val;
                    }
                    if (spec.value_nominal !== null && spec.value_nominal !== '') {
                        const val = parseFloat(spec.value_nominal);
                        if (!isNaN(val)) thresholds.surfaceMass.nominal = val;
                    }
                    if (spec.value_max_alert !== null && spec.value_max_alert !== '') {
                        const val = parseFloat(spec.value_max_alert);
                        if (!isNaN(val)) thresholds.surfaceMass.maxAlert = val;
                    }
                    if (spec.value_max !== null && spec.value_max !== '') {
                        const val = parseFloat(spec.value_max);
                        if (!isNaN(val)) thresholds.surfaceMass.max = val;
                    }
                }
                
                // Extrait sec (nom en français dans la DB)
                if (specName === 'extrait sec') {
                    if (spec.value_min !== null && spec.value_min !== '') {
                        const val = parseFloat(spec.value_min);
                        if (!isNaN(val)) thresholds.dryExtract.min = val;
                    }
                    if (spec.value_min_alert !== null && spec.value_min_alert !== '') {
                        const val = parseFloat(spec.value_min_alert);
                        if (!isNaN(val)) thresholds.dryExtract.minAlert = val;
                    }
                    if (spec.value_nominal !== null && spec.value_nominal !== '') {
                        const val = parseFloat(spec.value_nominal);
                        if (!isNaN(val)) thresholds.dryExtract.nominal = val;
                    }
                    if (spec.value_max_alert !== null && spec.value_max_alert !== '') {
                        const val = parseFloat(spec.value_max_alert);
                        if (!isNaN(val)) thresholds.dryExtract.maxAlert = val;
                    }
                    if (spec.value_max !== null && spec.value_max !== '') {
                        const val = parseFloat(spec.value_max);
                        if (!isNaN(val)) thresholds.dryExtract.max = val;
                    }
                }
            });
            
            console.log('Seuils chargés depuis le profil:', thresholds);
            this.thresholds = thresholds;
            
            // Vérifier si les seuils ont été mis à jour
            if (JSON.stringify(thresholds.micrometry) === JSON.stringify(qualityControlBusinessLogic.defaultThresholds.micrometry)) {
                console.warn('Attention: Les seuils de micronnaire n\'ont pas été mis à jour depuis le profil!');
            }
        },
        
        // Mettre à jour les micrométries
        updateMicrometry() {
            // Vérifier que micrometry existe
            if (!this.micrometry) return;
            
            // Calculer les moyennes
            this.micrometry.averageLeft = qualityControlBusinessLogic.calculateAverage(this.micrometry.left);
            this.micrometry.averageRight = qualityControlBusinessLogic.calculateAverage(this.micrometry.right);
            
            // Ne mettre à jour le statut que si toutes les propriétés existent
            if (this.surfaceMass && this.dryExtract) {
                this.updateStatus();
            }
            this.saveToSession();
        },
        
        // Mettre à jour les masses surfaciques
        updateSurfaceMass() {
            // Vérifier que surfaceMass existe
            if (!this.surfaceMass) return;
            
            // Calculer les moyennes - uniquement si les DEUX valeurs sont présentes
            const leftValues = [this.surfaceMass.leftLeft, this.surfaceMass.leftCenter];
            const rightValues = [this.surfaceMass.rightCenter, this.surfaceMass.rightRight];
            
            // Vérifier que les deux valeurs gauche sont remplies
            if (leftValues.every(v => v !== null && v !== undefined && v !== '')) {
                const left = leftValues.map(v => parseFloat(v));
                this.surfaceMass.averageLeft = qualityControlBusinessLogic.calculateAverage(left);
            } else {
                this.surfaceMass.averageLeft = null;
            }
            
            // Vérifier que les deux valeurs droite sont remplies
            if (rightValues.every(v => v !== null && v !== undefined && v !== '')) {
                const right = rightValues.map(v => parseFloat(v));
                this.surfaceMass.averageRight = qualityControlBusinessLogic.calculateAverage(right);
            } else {
                this.surfaceMass.averageRight = null;
            }
            
            this.updateStatus();
            this.saveToSession();
        },
        
        // Mettre à jour l'extrait sec
        updateDryExtract() {
            // Vérifier que dryExtract existe
            if (!this.dryExtract) return;
            
            // Gérer le timestamp pour la valeur
            if (this.dryExtract.value && this.dryExtract.value !== '') {
                // Ajouter timestamp seulement si c'est une nouvelle valeur
                if (!this.dryExtract.timestamp) {
                    this.dryExtract.timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                }
            } else {
                // Supprimer le timestamp si la valeur est effacée
                this.dryExtract.timestamp = null;
            }
            
            this.updateStatus();
            this.saveToSession();
        },
        
        // Mettre à jour LOI
        updateLOI() {
            // Vérifier que dryExtract existe
            if (!this.dryExtract) return;
            
            // Gérer le timestamp pour LOI - seulement quand c'est coché
            if (this.dryExtract.sample === true) {
                // Ajouter timestamp seulement si c'est une nouvelle activation
                if (!this.dryExtract.loiTimestamp) {
                    this.dryExtract.loiTimestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                }
            } else {
                // Supprimer le timestamp si décoché
                this.dryExtract.loiTimestamp = null;
            }
            
            this.updateStatus();
            this.saveToSession();
        },
        
        // Mettre à jour tous les calculs
        updateAllCalculations() {
            // Ne mettre à jour que si les propriétés existent
            if (this.micrometry) {
                this.updateMicrometry();
            }
            if (this.surfaceMass) {
                this.updateSurfaceMass();
            }
            // Ne mettre à jour le statut que si toutes les propriétés existent
            if (this.micrometry && this.surfaceMass && this.dryExtract) {
                this.updateStatus();
            }
        },
        
        // Mettre à jour le statut global
        updateStatus() {
            // S'assurer que les propriétés existent
            if (!this.micrometry || !this.surfaceMass || !this.dryExtract) {
                this.qcStatus = 'pending';
                return;
            }
            
            const data = {
                micrometry: this.micrometry,
                surfaceMass: this.surfaceMass,
                dryExtract: this.dryExtract
            };
            
            this.qcStatus = qualityControlBusinessLogic.calculateQCStatus(data, this.thresholds);
            
            // Émettre un événement pour le badge de conformité
            window.dispatchEvent(new CustomEvent('quality-control-updated', {
                detail: {
                    status: this.qcStatus,
                    data: data
                }
            }));
        },
        
        // Obtenir la classe CSS pour un input
        getInputClass(type, value) {
            if (value === null || value === '') return '';
            
            const status = qualityControlBusinessLogic.validateMeasure(
                value, 
                this.thresholds[type]
            );
            
            switch(status) {
                case 'success':
                    return 'border-success';
                case 'warning':
                    return 'border-warning';
                case 'error':
                    return 'border-danger';
                default:
                    return '';
            }
        },
        
        // Obtenir la classe CSS pour une moyenne
        getMoyenneClass(type, value) {
            if (value === null) return '';
            
            // S'assurer que les thresholds sont chargés
            if (!this.thresholds || !this.thresholds[type]) {
                console.warn(`No thresholds loaded for ${type}, using defaults`);
                this.thresholds = qualityControlBusinessLogic.defaultThresholds;
            }
            
            const status = qualityControlBusinessLogic.validateMeasure(
                value,
                this.thresholds[type]
            );
            
            console.log(`Moyenne ${type}: value=${value}, status=${status}, thresholds:`, this.thresholds[type]);
            
            return qualityControlFormatters.getStatusClass(status);
        },
        
        // Formater une moyenne
        formatMoyenne(value, type) {
            return qualityControlFormatters.formatAverage(value, type);
        },
        
        // Formater un timestamp
        formatTimestamp(timestamp) {
            return timestamp || '--:--';
        },
        
        // Formater un nombre sur blur (ajouter 0 devant la virgule)
        formatNumber(event, type) {
            let value = event.target.value;
            if (!value) return;
            
            // Remplacer virgule par point
            value = value.replace(',', '.');
            
            // Si commence par un point, ajouter 0 devant
            if (value.startsWith('.')) {
                value = '0' + value;
            }
            
            // Parser et reformater
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                event.target.value = parsed;
                
                // Mettre à jour le modèle selon le type
                const path = event.target.getAttribute('x-model');
                if (path) {
                    // Utiliser $data pour accéder aux propriétés imbriquées
                    const parts = path.split('.');
                    let obj = this;
                    for (let i = 0; i < parts.length - 1; i++) {
                        obj = obj[parts[i]];
                    }
                    obj[parts[parts.length - 1]] = parsed;
                }
            } else {
                // Si ce n'est pas un nombre valide, vider le champ
                event.target.value = '';
            }
        },
        
        // Valider la saisie en temps réel
        validateNumericInput(event) {
            // Autoriser uniquement les chiffres, le point et la virgule
            const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
            
            if (!allowedKeys.includes(event.key)) {
                event.preventDefault();
                return false;
            }
            
            // Empêcher plusieurs points ou virgules
            const currentValue = event.target.value;
            if ((event.key === '.' || event.key === ',') && (currentValue.includes('.') || currentValue.includes(','))) {
                event.preventDefault();
                return false;
            }
        }
    }
}