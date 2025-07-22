// Composant Alpine.js pour le timer depuis le dernier save rouleau
function rollTimer() {
    return {
        // État
        lastSaveTime: null,
        elapsedTime: '--:--',
        lastSaveHour: '--:--',
        updateInterval: null,
        
        // Initialisation
        init() {
            // Charger depuis la session
            this.loadFromSession();
            
            // Démarrer le timer
            this.startTimer();
            
            // Écouter l'événement de sauvegarde du rouleau
            window.addEventListener('roll-saved', () => {
                this.resetTimer();
            });
            
            // Mettre à jour immédiatement l'affichage
            this.updateDisplay();
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData?.last_roll_save_time) {
                this.lastSaveTime = window.sessionData.last_roll_save_time;
            }
        },
        
        // Sauvegarder en session
        async saveToSession() {
            await api.saveToSession({
                last_roll_save_time: this.lastSaveTime
            });
        },
        
        // Réinitialiser le timer
        resetTimer() {
            console.log('Timer reset - nouveau save rouleau');
            this.lastSaveTime = new Date().toISOString();
            this.saveToSession();
            this.updateDisplay();
        },
        
        // Démarrer le timer
        startTimer() {
            // Mettre à jour chaque minute
            this.updateInterval = setInterval(() => {
                this.updateDisplay();
            }, 60000); // 60 secondes
        },
        
        // Mettre à jour l'affichage
        updateDisplay() {
            if (!this.lastSaveTime) {
                this.elapsedTime = '--:--';
                this.lastSaveHour = '--:--';
                return;
            }
            
            const now = new Date();
            const lastSave = new Date(this.lastSaveTime);
            
            // Calculer le temps écoulé
            const diffMs = now - lastSave;
            const totalMinutes = Math.floor(diffMs / 60000);
            const elapsedHours = Math.floor(totalMinutes / 60);
            const elapsedMinutes = totalMinutes % 60;
            
            // Formater le temps écoulé
            this.elapsedTime = `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}`;
            
            // Formater l'heure du dernier save
            const saveHours = lastSave.getHours();
            const saveMinutes = lastSave.getMinutes();
            this.lastSaveHour = `${String(saveHours).padStart(2, '0')}:${String(saveMinutes).padStart(2, '0')}`;
        },
        
        // Nettoyage
        destroy() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        }
    };
}