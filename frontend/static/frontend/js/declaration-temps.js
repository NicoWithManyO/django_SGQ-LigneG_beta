// Composant Alpine.js pour la déclaration de temps
function declarationTemps() {
    return {
        // État
        motifId: '',
        commentaire: '',
        duree: '',
        motifs: [],
        arrets: [],
        tempsTotal: '0h00',
        nombreArrets: 0,
        
        // Initialisation
        init() {
            // Charger les motifs d'arrêt
            this.loadMotifs();
            
            // Charger les arrêts du poste en cours
            this.loadArrets();
            
            // Écouter les événements
            window.addEventListener('shift-changed', () => {
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
        async loadArrets() {
            try {
                const data = await api.getLostTimeEntries();
                this.arrets = data;
                this.calculerStats();
            } catch (error) {
                console.error('Erreur chargement arrêts:', error);
            }
        },
        
        // Vérifier si on peut déclarer
        canDeclare() {
            return this.motifId && this.duree && parseInt(this.duree) > 0;
        },
        
        // Déclarer un arrêt
        async declarer() {
            if (!this.canDeclare()) return;
            
            const data = {
                reason: this.motifId,
                comment: this.commentaire || '',
                duration: parseInt(this.duree)
            };
            
            try {
                await api.createLostTimeEntry(data);
                
                // Réinitialiser le formulaire
                this.motifId = '';
                this.commentaire = '';
                this.duree = '';
                
                // Recharger les arrêts
                await this.loadArrets();
                
                // Émettre un événement pour mettre à jour le header
                this.emitTimeUpdate();
            } catch (error) {
                console.error('Erreur déclaration:', error);
            }
        },
        
        // Supprimer un arrêt
        async supprimerArret(id) {
            try {
                await api.deleteLostTimeEntry(id);
                await this.loadArrets();
                this.emitTimeUpdate();
            } catch (error) {
                console.error('Erreur suppression:', error);
            }
        },
        
        // Calculer les statistiques
        calculerStats() {
            const totalMinutes = this.arrets.reduce((sum, arret) => sum + arret.duration, 0);
            this.nombreArrets = this.arrets.length;
            
            // Convertir en heures et minutes
            const heures = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            this.tempsTotal = `${heures}h${minutes.toString().padStart(2, '0')}`;
            
            // Si le temps total a changé, émettre l'événement
            if (this.tempsTotal !== window.sessionData?.temps_total) {
                this.emitTimeUpdate();
            }
        },
        
        // Émettre un événement de mise à jour
        async emitTimeUpdate() {
            window.dispatchEvent(new CustomEvent('lost-time-updated', {
                detail: { tempsTotal: this.tempsTotal }
            }));
            
            // Sauvegarder le temps total dans la session
            await api.saveToSession({ temps_total: this.tempsTotal });
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