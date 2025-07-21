// Composant Alpine.js pour la fiche de poste
function shiftForm() {
    return {
        // Inclure les mixins partagés
        ...sharedMixins.sessionSaver,
        // État
        operatorId: '',
        shiftDate: '',
        vacation: '',
        startTime: '',
        endTime: '',
        machineStartedStart: false,
        machineStartedEnd: false,
        lengthStart: '',
        lengthEnd: '',
        comment: '',
        shiftId: null,
        isValid: false,
        hasValidId: false, // Pour l'icône ID Poste uniquement
        qcStatus: 'pending', // Statut du contrôle qualité
        checklistSigned: false, // Statut de signature de la checklist
        hasStartupTime: false, // Indique si du temps de démarrage a été déclaré
        
        // Initialisation
        init() {
            // Charger les données de session
            this.loadFromSession();
            
            // Générer l'ID au chargement après que le DOM soit mis à jour
            this.$nextTick(() => {
                this.generateShiftId();
            });
            
            // Watchers individuels pour les champs qui affectent shiftId
            this.$watch('operatorId', () => {
                this.generateShiftId();
                // Émettre un événement pour notifier le changement d'opérateur
                window.dispatchEvent(new Event('operator-changed'));
            });
            
            this.$watch('shiftDate', () => {
                this.generateShiftId();
            });
            
            this.$watch('vacation', () => {
                this.generateShiftId();
                if (this.vacation) {
                    this.setDefaultHours();
                }
            });
            
            // Watchers spécifiques pour la logique métier
            this.$watch('machineStartedStart', () => {
                if (!this.machineStartedStart) {
                    this.lengthStart = '';
                }
                this.validateForm();
            });
            
            this.$watch('machineStartedEnd', () => {
                if (!this.machineStartedEnd) {
                    this.lengthEnd = '';
                }
                this.validateForm();
            });
            
            // Watchers pour la validation
            this.$watch('startTime', () => this.validateForm());
            this.$watch('endTime', () => this.validateForm());
            this.$watch('lengthStart', () => this.validateForm());
            this.$watch('lengthEnd', () => this.validateForm());
            
            // Initialiser la sauvegarde automatique pour tous les champs
            this.initAutoSave([
                'operatorId', 'shiftDate', 'vacation',
                'startTime', 'endTime',
                'machineStartedStart', 'machineStartedEnd',
                'lengthStart', 'lengthEnd', 'comment'
            ]);
            
            // Écouter les changements du contrôle qualité
            window.addEventListener('quality-control-updated', (e) => {
                this.qcStatus = e.detail.status;
                this.validateForm();
            });
            
            // Écouter les changements de la checklist
            window.addEventListener('checklist-status-changed', (e) => {
                this.checklistSigned = e.detail.signed || false;
                this.validateForm();
            });
            
            // Écouter les changements de temps perdu
            window.addEventListener('lost-time-updated', (e) => {
                this.hasStartupTime = e.detail.hasStartupTime || false;
                this.validateForm();
            });
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                // S'assurer que les valeurs sont des chaînes pour éviter l'erreur trim()
                this.operatorId = String(window.sessionData.operator_id || '');
                this.shiftDate = String(window.sessionData.shift_date || '');
                this.vacation = String(window.sessionData.vacation || '');
                this.startTime = String(window.sessionData.start_time || '');
                this.endTime = String(window.sessionData.end_time || '');
                this.machineStartedStart = window.sessionData.machine_started_start || false;
                this.machineStartedEnd = window.sessionData.machine_started_end || false;
                this.lengthStart = String(window.sessionData.length_start || '');
                this.lengthEnd = String(window.sessionData.length_end || '');
                this.comment = String(window.sessionData.comment || '');
                
                // Charger le statut QC depuis la session
                if (window.sessionData.qc_status) {
                    this.qcStatus = window.sessionData.qc_status;
                }
                
                // Charger le statut de la checklist depuis la session
                if (window.sessionData.checklist_signature_time) {
                    this.checklistSigned = true;
                }
                
                // Charger le statut du temps de démarrage depuis la session
                if (window.sessionData.has_startup_time) {
                    this.hasStartupTime = true;
                }
                
                // Vérifier aussi directement dans les lost_time_entries au cas où
                if (window.sessionData.lost_time_entries && window.sessionData.lost_time_entries.length > 0) {
                    // Déclencher manuellement l'événement pour recalculer hasStartupTime
                    window.dispatchEvent(new CustomEvent('lost-time-updated', {
                        detail: { 
                            hasStartupTime: window.sessionData.has_startup_time || false
                        }
                    }));
                }
            }
        },
        
        // Override pour mapper les noms de champs
        async saveToSession(data) {
            // Si pas de data fournie, utiliser tous les champs
            if (!data) {
                data = {
                    operatorId: this.operatorId,
                    shiftDate: this.shiftDate,
                    vacation: this.vacation,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    machineStartedStart: this.machineStartedStart,
                    machineStartedEnd: this.machineStartedEnd,
                    lengthStart: this.lengthStart,
                    lengthEnd: this.lengthEnd,
                    comment: this.comment
                };
            }
            
            // Mapper camelCase vers snake_case pour l'API
            const mappedData = {};
            const fieldMapping = {
                operatorId: 'operator_id',
                shiftDate: 'shift_date',
                startTime: 'start_time',
                endTime: 'end_time',
                machineStartedStart: 'machine_started_start',
                machineStartedEnd: 'machine_started_end',
                lengthStart: 'length_start',
                lengthEnd: 'length_end'
            };
            
            // Ajouter l'ID du poste s'il existe
            if (this.shiftId) {
                mappedData.shift_id = this.shiftId;
            }
            
            Object.keys(data).forEach(key => {
                const mappedKey = fieldMapping[key] || key;
                mappedData[mappedKey] = data[key] || null;
            });
            
            await api.saveToSession(mappedData);
        },
        
        // Générer l'ID du poste
        generateShiftId() {
            if (this.operatorId && this.shiftDate && this.vacation) {
                // Format: JJMMAA_PrenomNom_Vacation
                const date = new Date(this.shiftDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                
                // Récupérer le nom de l'opérateur depuis le select
                const operatorSelect = document.getElementById('operator-select');
                const operatorName = operatorSelect?.options[operatorSelect.selectedIndex]?.text || '';
                
                if (operatorName && operatorName !== '--') {
                    const nameParts = operatorName.trim().split(' ');
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join('').toUpperCase() || '';
                    this.shiftId = `${day}${month}${year}_${firstName}${lastName}_${this.vacation}`;
                    this.hasValidId = true;
                } else {
                    this.shiftId = null;
                    this.hasValidId = false;
                }
            } else {
                this.shiftId = null;
                this.hasValidId = false;
            }
            
            // Valider après génération de l'ID
            this.validateForm();
            
            // Sauvegarder l'ID en session s'il a changé
            // Commenté temporairement - cause erreur 400
            // if (this.shiftId) {
            //     this.saveToSession({ shift_id: this.shiftId });
            // }
        },
        
        // Valider le formulaire complet
        validateForm() {
            // Vérifier les champs obligatoires de base
            if (!this.shiftId || !this.startTime || !this.endTime) {
                this.isValid = false;
                return;
            }
            
            // Vérifier que le contrôle qualité est fait (pas pending)
            if (this.qcStatus === 'pending') {
                this.isValid = false;
                return;
            }
            
            // Vérifier que la checklist est signée
            if (!this.checklistSigned) {
                this.isValid = false;
                return;
            }
            
            // Si machine pas démarrée, vérifier qu'il y a du temps de démarrage
            if (!this.machineStartedStart && !this.hasStartupTime) {
                this.isValid = false;
                return;
            }
            
            // Vérifier la cohérence machine/métrage
            if (this.machineStartedStart && !this.lengthStart) {
                this.isValid = false;
                return;
            }
            
            if (this.machineStartedEnd && !this.lengthEnd) {
                this.isValid = false;
                return;
            }
            
            // Vérifier la cohérence des heures (sauf pour vacation Nuit)
            if (this.vacation !== 'Nuit') {
                const start = this.timeToMinutes(this.startTime);
                const end = this.timeToMinutes(this.endTime);
                
                if (start >= end) {
                    this.isValid = false;
                    return;
                }
            }
            
            // Vérifier la cohérence des métrages si les deux sont renseignés
            if (this.lengthStart && this.lengthEnd) {
                const startLength = parseFloat(this.lengthStart) || 0;
                const endLength = parseFloat(this.lengthEnd) || 0;
                
                if (endLength < startLength) {
                    this.isValid = false;
                    return;
                }
            }
            
            // Toutes les validations sont passées
            this.isValid = true;
        },
        
        // Convertir heure HH:MM en minutes
        timeToMinutes(time) {
            if (!time) return 0;
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        },
        
        // Obtenir le message de validation pour le tooltip
        getValidationMessage() {
            const messages = [];
            
            // Vérifier les champs de base
            if (!this.operatorId) messages.push("Sélectionner un opérateur");
            if (!this.shiftDate) messages.push("Saisir la date");
            if (!this.vacation) messages.push("Sélectionner la vacation");
            if (!this.startTime) messages.push("Saisir l'heure de début");
            if (!this.endTime) messages.push("Saisir l'heure de fin");
            
            // Vérifier le contrôle qualité
            if (this.qcStatus === 'pending') messages.push("Compléter le contrôle qualité");
            
            // Vérifier la checklist
            if (!this.checklistSigned) messages.push("Signer la checklist de démarrage");
            
            // Vérifier le temps de démarrage si machine pas démarrée
            if (!this.machineStartedStart && !this.hasStartupTime) {
                messages.push("Déclarer le temps de démarrage machine");
            }
            
            // Vérifier la cohérence machine/métrage
            if (this.machineStartedStart && !this.lengthStart) {
                messages.push("Saisir le métrage de début (machine démarrée)");
            }
            if (this.machineStartedEnd && !this.lengthEnd) {
                messages.push("Saisir le métrage de fin (machine démarrée)");
            }
            
            // Vérifier la cohérence des heures
            if (this.startTime && this.endTime && this.vacation !== 'Nuit') {
                const start = this.timeToMinutes(this.startTime);
                const end = this.timeToMinutes(this.endTime);
                if (start >= end) messages.push("L'heure de fin doit être après l'heure de début");
            }
            
            // Vérifier la cohérence des métrages
            if (this.lengthStart && this.lengthEnd) {
                const startLength = parseFloat(this.lengthStart) || 0;
                const endLength = parseFloat(this.lengthEnd) || 0;
                if (endLength < startLength) {
                    messages.push("Le métrage de fin doit être supérieur au métrage de début");
                }
            }
            
            return messages.length > 0 ? messages.join(" • ") : "";
        },
        
        // Définir les heures par défaut selon la vacation
        setDefaultHours() {
            switch(this.vacation) {
                case 'Matin':
                    this.startTime = '04:00';
                    this.endTime = '12:00';
                    break;
                case 'ApresMidi':
                    this.startTime = '12:00';
                    this.endTime = '20:00';
                    break;
                case 'Nuit':
                    this.startTime = '20:00';
                    this.endTime = '04:00';
                    break;
                case 'Journee':
                    this.startTime = '07:30';
                    this.endTime = '15:30';
                    break;
                default:
                    // Ne pas changer si vacation vide
                    break;
            }
        },
        
        // Sauvegarder le poste
        async saveShift() {
            if (!this.isValid) return;
            
            // À FAIRE: Implémenter la sauvegarde du poste
            console.log('Sauvegarde du poste avec ID:', this.shiftId);
            alert('Fonctionnalité à implémenter : Sauvegarde du poste');
        }
    };
}