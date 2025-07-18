// Composant Alpine.js pour la Fiche de Poste
document.addEventListener('alpine:init', () => {
    Alpine.data('fichePoste', () => ({
        // État initial - sera écrasé par les données de session
        operatorId: null,
        shiftDate: '',
        vacation: '',
        startTime: '',
        endTime: '',
        notes: '',
        
        // Mapping des horaires par vacation
        vacationTimes: {
            'MATIN': { start: '04:00', end: '12:00' },
            'APRES_MIDI': { start: '12:00', end: '20:00' },
            'NUIT': { start: '20:00', end: '04:00' },
            'JOURNEE': { start: '07:30', end: '15:30' }
        },
        
        // Initialisation
        init() {
            // Initialiser avec les données de session passées par Django
            const sessionData = window.sessionData || {};
            const currentOperator = window.currentOperator;
            
            // Charger l'opérateur
            if (currentOperator) {
                this.operatorId = currentOperator.id;
            }
            
            // Charger les données de session (sans valeurs par défaut)
            this.shiftDate = sessionData.shift_date || '';
            this.vacation = sessionData.vacation || '';
            this.startTime = sessionData.start_time || '';
            this.endTime = sessionData.end_time || '';
            
            // Si vacation est définie mais pas les heures, les calculer
            if (this.vacation && (!this.startTime || !this.endTime)) {
                this.updateTimes();
            }
            
            // Écouter les changements pour sauvegarder (avec un petit délai pour éviter trop d'appels)
            let saveTimeout;
            const debouncedSave = () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => this.saveToSession(), 500);
            };
            
            this.$watch('operatorId', debouncedSave);
            this.$watch('vacation', () => {
                this.updateTimes();
                debouncedSave();
            });
            this.$watch('shiftDate', debouncedSave);
            this.$watch('startTime', debouncedSave);
            this.$watch('endTime', debouncedSave);
        },
        
        // Computed : ID du poste
        get shiftId() {
            if (!this.shiftDate || !this.operatorId) return '--';
            
            const dateStr = this.shiftDate.replace(/-/g, '').substring(2);
            const operator = this.getOperatorName();
            const vacation = this.vacation ? this.vacation.toLowerCase() : '';
            
            return `${dateStr}_${operator}_${vacation}`;
        },
        
        // Récupérer le nom de l'opérateur sélectionné
        getOperatorName() {
            if (!this.operatorId) return '--';
            
            const select = document.querySelector('[x-model="operatorId"]');
            const option = select?.querySelector(`option[value="${this.operatorId}"]`);
            
            if (option) {
                const text = option.textContent.trim();
                const [firstName, lastName] = text.split(' ');
                return `${firstName}${lastName}`;
            }
            
            return '--';
        },
        
        // Mettre à jour les heures selon la vacation
        updateTimes() {
            if (!this.vacation) {
                this.startTime = '';
                this.endTime = '';
                return;
            }
            
            const times = this.vacationTimes[this.vacation];
            this.startTime = times.start;
            this.endTime = times.end;
        },
        
        
        // Définir l'heure actuelle
        setCurrentTime(field) {
            const now = new Date();
            const time = now.toTimeString().substring(0, 5);
            this[field] = time;
        },
        
        // Définir la date d'aujourd'hui
        setToday() {
            this.shiftDate = new Date().toISOString().split('T')[0];
            this.saveToSession(); // Sauvegarder immédiatement
        },
        
        // Récupérer le token CSRF
        getCsrfToken() {
            return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
        },
        
        
        // Sauvegarder en session
        async saveToSession() {
            try {
                const sessionData = {
                    operator_id: this.operatorId || null,
                    shift_date: this.shiftDate || null,
                    vacation: this.vacation || null,
                    start_time: this.startTime || null,
                    end_time: this.endTime || null
                };
                
                const response = await fetch('/api/session/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken()
                    },
                    body: JSON.stringify(sessionData)
                });
                
                if (!response.ok) {
                    console.error('Erreur lors de la sauvegarde en session');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
            }
        }
    }));
});