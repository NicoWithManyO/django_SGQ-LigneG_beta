// Composant Alpine.js pour la déclaration de temps
function timeDeclaration() {
    return {
        // État
        motifId: '',
        commentaire: '',
        duree: '',
        motifs: [],
        arrets: [],
        totalTime: '0h00',
        nombreArrets: 0,
        
        // Initialisation
        init() {
            // Charger les motifs d'arrêt
            this.loadMotifs();
            
            // Charger les arrêts après un court délai pour s'assurer que sessionData est prêt
            this.$nextTick(() => {
                this.loadArrets();
                
                // Émettre l'événement initial après le chargement
                // pour que shift-form soit informé du statut
                setTimeout(() => {
                    const hasStartup = this.arrets.some(arret => {
                        const motifName = this.getMotifName(arret.reason);
                        return motifName === 'Démarrage';
                    });
                    window.dispatchEvent(new CustomEvent('lost-time-updated', {
                        detail: { 
                            totalTime: this.totalTime,
                            total: this.arrets.reduce((sum, arret) => sum + arret.duration, 0), // Total en minutes
                            hasStartupTime: hasStartup
                        }
                    }));
                }, 100);
            });
            
            // Écouter les événements
            window.addEventListener('shift-changed', () => {
                this.loadArrets();
            });
            
            // Écouter les changements de session
            window.addEventListener('session-changed', () => {
                this.loadArrets();
            });
        },
        
        // Charger les motifs depuis l'API
        async loadMotifs() {
            try {
                const data = await api.getLostTimeReasons();
                this.motifs = data.filter(m => m.is_active);
            } catch (error) {
                console.error('Erreur chargement motifs:', error);
            }
        },
        
        // Charger les arrêts du poste
        loadArrets() {
            // Charger uniquement depuis la session
            if (window.sessionData?.lost_time_entries) {
                this.arrets = window.sessionData.lost_time_entries;
            } else {
                this.arrets = [];
            }
            this.calculerStats();
        },
        
        // Vérifier si on peut déclarer
        canDeclare() {
            return this.motifId && this.duree && parseInt(this.duree) > 0;
        },
        
        // Déclarer un arrêt
        async declarer() {
            if (!this.canDeclare()) return;
            
            // Créer un nouvel arrêt avec un ID temporaire
            const newArret = {
                id: 'temp_' + Date.now(), // ID temporaire
                reason: parseInt(this.motifId),
                comment: this.commentaire || '',
                duration: parseInt(this.duree),
                created_at: new Date().toISOString()
            };
            
            // Ajouter au tableau local
            this.arrets.push(newArret);
            
            // Sauvegarder dans la session
            await api.saveToSession({
                lost_time_entries: this.arrets
            });
            
            // Réinitialiser le formulaire
            this.motifId = '';
            this.commentaire = '';
            this.duree = '';
            
            // Recalculer les stats
            this.calculerStats();
        },
        
        // Supprimer un arrêt
        async supprimerArret(id) {
            // Filtrer pour retirer l'arrêt
            this.arrets = this.arrets.filter(arret => arret.id !== id);
            
            // Sauvegarder dans la session
            await api.saveToSession({
                lost_time_entries: this.arrets
            });
            
            // Recalculer les stats
            this.calculerStats();
        },
        
        // Calculer les statistiques
        calculerStats() {
            const totalMinutes = this.arrets.reduce((sum, arret) => sum + arret.duration, 0);
            this.nombreArrets = this.arrets.length;
            
            // Vérifier s'il y a un arrêt "Démarrage"
            const hasStartupTime = this.arrets.some(arret => {
                const motifName = this.getMotifName(arret.reason);
                return motifName === 'Démarrage';
            });
            
            // Convertir en heures et minutes
            const heures = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            this.totalTime = `${heures}h${minutes.toString().padStart(2, '0')}`;
            
            // Si le temps total a changé ou si le statut de démarrage a changé, émettre l'événement
            if (this.totalTime !== window.sessionData?.temps_total || 
                hasStartupTime !== window.sessionData?.has_startup_time) {
                this.emitTimeUpdate(hasStartupTime, totalMinutes);
            }
        },
        
        // Émettre un événement de mise à jour
        async emitTimeUpdate(hasStartupTime = false, totalMinutes = 0) {
            window.dispatchEvent(new CustomEvent('lost-time-updated', {
                detail: { 
                    totalTime: this.totalTime,
                    total: totalMinutes, // Total en minutes
                    hasStartupTime: hasStartupTime
                }
            }));
            
            // Sauvegarder le temps total et le statut de démarrage dans la session
            await api.saveToSession({ 
                temps_total: this.totalTime,
                has_startup_time: hasStartupTime
            });
        },
        
        
        // Formater l'heure - utilise la fonction du module common
        formatTime(timeString) {
            return utils.formatTime(timeString);
        },
        
        // Obtenir le nom du motif
        getMotifName(motifId) {
            const motif = this.motifs.find(m => m.id === motifId);
            return motif ? motif.name : '';
        }
    };
}