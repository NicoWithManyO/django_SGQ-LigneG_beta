// Composant Alpine.js pour la fiche de poste
function fichePoste() {
    return {
        // État
        operatorId: '',
        shiftDate: '',
        vacation: '',
        startTime: '',
        endTime: '',
        machineStarted: false,
        machineStopped: false,
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
            
            // Watchers pour générer l'ID du poste et sauvegarder
            this.$watch('operatorId', () => {
                this.generateShiftId();
                this.saveToSession();
            });
            this.$watch('shiftDate', () => {
                this.generateShiftId();
                this.saveToSession();
            });
            this.$watch('vacation', () => {
                this.generateShiftId();
                this.setDefaultHours();
                this.saveToSession();
            });
            this.$watch('startTime', () => this.saveToSession());
            this.$watch('endTime', () => this.saveToSession());
            this.$watch('machineStarted', () => {
                if (!this.machineStarted) {
                    this.lengthStart = '';
                }
                this.saveToSession();
            });
            this.$watch('machineStopped', () => {
                if (!this.machineStopped) {
                    this.lengthEnd = '';
                }
                this.saveToSession();
            });
            this.$watch('lengthStart', () => this.saveToSession());
            this.$watch('lengthEnd', () => this.saveToSession());
            this.$watch('comment', () => this.saveToSession());
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                this.operatorId = window.sessionData.operator_id || '';
                this.shiftDate = window.sessionData.shift_date || '';
                this.vacation = window.sessionData.vacation || '';
                this.startTime = window.sessionData.start_time || '';
                this.endTime = window.sessionData.end_time || '';
                this.machineStarted = window.sessionData.machine_started || false;
                this.machineStopped = window.sessionData.machine_stopped || false;
                this.lengthStart = window.sessionData.length_start || '';
                this.lengthEnd = window.sessionData.length_end || '';
                this.comment = window.sessionData.comment || '';
            }
        },
        
        // Sauvegarder en session via API
        async saveToSession() {
            const data = {
                operator_id: this.operatorId || null,
                shift_date: this.shiftDate || null,
                vacation: this.vacation || null,
                start_time: this.startTime || null,
                end_time: this.endTime || null,
                machine_started: this.machineStarted,
                machine_stopped: this.machineStopped,
                length_start: this.lengthStart || null,
                length_end: this.lengthEnd || null,
                comment: this.comment || null,
            };
            
            await api.saveToSession(data);
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
                    console.log('ID généré:', this.shiftId); // Debug
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
            
            // TODO: Implémenter la sauvegarde du poste
            console.log('Sauvegarde du poste avec ID:', this.shiftId);
            alert('Fonctionnalité à implémenter : Sauvegarde du poste');
        }
    };
}