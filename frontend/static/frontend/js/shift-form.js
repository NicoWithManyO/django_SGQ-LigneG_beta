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
            });
            
            this.$watch('machineStartedEnd', () => {
                if (!this.machineStartedEnd) {
                    this.lengthEnd = '';
                }
            });
            
            // Initialiser la sauvegarde automatique pour tous les champs
            this.initAutoSave([
                'operatorId', 'shiftDate', 'vacation',
                'startTime', 'endTime',
                'machineStartedStart', 'machineStartedEnd',
                'lengthStart', 'lengthEnd', 'comment'
            ]);
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
                    this.isValid = true;
                } else {
                    this.shiftId = null;
                    this.isValid = false;
                }
            } else {
                this.shiftId = null;
                this.isValid = false;
            }
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