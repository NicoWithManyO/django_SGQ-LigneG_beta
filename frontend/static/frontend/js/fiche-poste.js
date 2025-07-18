// Composant Alpine.js pour la fiche de poste
function fichePoste() {
    return {
        // État
        operatorId: '',
        shiftDate: '',
        vacation: '',
        shiftId: null,
        isValid: false,
        
        // Initialisation
        init() {
            // Charger les données de session
            this.loadFromSession();
            
            // Watcher pour générer l'ID du poste
            this.$watch(['operatorId', 'shiftDate', 'vacation'], () => {
                this.generateShiftId();
                this.saveToSession();
            });
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                this.operatorId = window.sessionData.operator_id || '';
                this.shiftDate = window.sessionData.shift_date || '';
                this.vacation = window.sessionData.vacation || '';
            }
        },
        
        // Sauvegarder en session via API
        async saveToSession() {
            const data = {
                operator_id: this.operatorId || null,
                shift_date: this.shiftDate || null,
                vacation: this.vacation || null,
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
                    const [firstName, lastName] = operatorName.split(' ');
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
        
        // Récupérer le token CSRF
        getCsrfToken() {
            const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
            return csrfInput ? csrfInput.value : '';
        }
    };
}