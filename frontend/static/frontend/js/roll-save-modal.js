// Composant Alpine.js pour la modal de sauvegarde du rouleau
function rollSaveModal() {
    return {
        // État
        isNonConform: false,
        isRollConform: true,
        rollId: '',
        length: '',
        netMass: '',
        weight: '',
        weightClass: '',
        hasAllThicknesses: false,
        isWeightOk: true,
        defectCount: 0,
        nokCount: 0,
        maxNok: 3,
        isSaved: false,
        isSaving: false,
        modalInstance: null,
        
        // Type de sauvegarde
        saveType: 'roll', // 'roll' ou 'shift'
        
        // Données pour le poste
        shiftTitle: 'Sauvegarder le poste',
        shiftQuestion: 'Confirmez-vous la sauvegarde du poste ?',
        shiftConfirmText: 'Sauvegarder le poste',
        shiftConfirmEvent: '',
        shiftCancelEvent: '',
        
        // Labels dynamiques pour réutiliser la même structure
        stat1Label: 'ÉPAISSEURS',
        stat1Value: 'OK',
        stat1Class: 'text-success',
        stat2Label: 'GRAMMAGE', 
        stat2Value: 'OK',
        stat2Class: 'text-success',
        stat3Label: 'DÉFAUTS',
        stat3Value: '0',
        stat3Class: 'text-success',
        stat4Label: 'NOK',
        stat4Value: '0/3',
        stat4Class: 'text-success',
        
        // Infos dynamiques
        info1Label: 'ID Rouleau :',
        info1Value: '--',
        info2Label: 'Longueur :',
        info2Value: '-- m',
        info3Label: 'Grammage :',
        info3Value: '-- g/m²',
        
        // Initialisation
        init() {
            // Récupérer l'instance Bootstrap de la modal
            const modalElement = document.getElementById('rollSaveModal');
            if (modalElement) {
                this.modalInstance = new bootstrap.Modal(modalElement);
            }
            
            // Écouter l'événement d'ouverture de la modal
            window.addEventListener('open-roll-save-modal', (event) => {
                this.isSaved = false; // Réinitialiser l'état
                this.updateModalData(event.detail);
                this.show();
            });
            
            // Écouter l'événement générique pour toutes les sauvegardes
            window.addEventListener('show-save-modal', (event) => {
                this.isSaved = false; // Réinitialiser l'état
                this.saveType = 'shift';
                this.updateShiftData(event.detail);
                this.show();
            });
            
            // Réinitialiser quand la modal se ferme
            modalElement?.addEventListener('hidden.bs.modal', () => {
                this.isSaved = false;
                this.isSaving = false;
                this.saveType = 'roll';
            });
            
            // Écouter le succès de la sauvegarde
            window.addEventListener('roll-saved', () => {
                this.isSaving = false;
                this.isSaved = true;
            });
            
            // Écouter le succès de la sauvegarde du poste
            window.addEventListener('shift-saved', () => {
                this.isSaving = false;
                this.isSaved = true;
            });
            
            // Écouter les erreurs de sauvegarde
            window.addEventListener('roll-save-error', () => {
                this.isSaving = false;
                this.isSaved = false;
            });
            
            // Écouter les erreurs de sauvegarde du poste
            window.addEventListener('shift-save-error', () => {
                this.isSaving = false;
                this.isSaved = false;
            });
            
            // Écouter l'événement pour fermer la modal
            window.addEventListener('hide-save-modal', () => {
                this.hide();
            });
            
        },
        
        // Mettre à jour les données de la modal pour un rouleau
        updateModalData(data) {
            this.saveType = 'roll';
            this.isNonConform = data.isNonConform || false;
            this.isRollConform = !data.isNonConform; // Inverse de isNonConform
            this.rollId = data.rollId || '';
            this.length = data.length || '';
            this.netMass = data.netMass || '';
            this.weight = data.weight || '';
            this.weightClass = data.weightClass || '';
            this.hasAllThicknesses = data.hasAllThicknesses || false;
            this.isWeightOk = data.isWeightOk !== false; // Default true
            this.defectCount = data.defectCount || 0;
            this.nokCount = data.nokCount || 0;
            this.maxNok = data.maxNok || 3;
            
            // Mettre à jour les labels pour un rouleau
            this.stat1Label = 'ÉPAISSEURS';
            this.stat1Value = this.hasAllThicknesses ? 'OK' : 'NOK';
            this.stat1Class = this.hasAllThicknesses ? 'text-success' : 'text-danger';
            
            this.stat2Label = 'GRAMMAGE';
            this.stat2Value = this.isWeightOk ? 'OK' : 'NOK';
            this.stat2Class = this.isWeightOk ? 'text-success' : 'text-danger';
            
            this.stat3Label = 'DÉFAUTS';
            this.stat3Value = String(this.defectCount);
            this.stat3Class = this.defectCount === 0 ? 'text-success' : 'text-warning';
            
            this.stat4Label = 'NOK';
            this.stat4Value = `${this.nokCount}/${this.maxNok}`;
            this.stat4Class = this.nokCount === 0 ? 'text-success' : (this.nokCount <= this.maxNok ? 'text-warning' : 'text-danger');
            
            // Infos du rouleau
            this.info1Label = 'ID Rouleau :';
            this.info1Value = this.rollId || '--';
            this.info2Label = 'Longueur :';
            this.info2Value = `${this.length || '--'} m`;
            this.info3Label = 'Grammage :';
            this.info3Value = this.weight || '-- g/m²';
        },
        
        // Mettre à jour les données de la modal pour un poste
        updateShiftData(data) {
            this.saveType = 'shift';
            this.shiftTitle = data.title || 'Sauvegarder le poste';
            this.shiftQuestion = 'Confirmez-vous la sauvegarde du poste ?';
            this.shiftConfirmText = data.confirmText || 'Sauvegarder le poste';
            this.shiftConfirmEvent = data.confirmEvent || '';
            this.shiftCancelEvent = data.cancelEvent || '';
            
            // Utiliser les données structurées
            const shiftData = data.shiftData || {};
            this.isRollConform = true; // Toujours conforme pour un poste
            
            // Statuts
            this.stat1Label = 'CONTRÔLE Q.';
            this.stat1Value = 'OK'; // Si on peut sauvegarder, c'est forcément OK
            this.stat1Class = 'text-success';
            
            this.stat2Label = 'CHECKLIST';
            this.stat2Value = 'OK'; // Si on peut sauvegarder, c'est forcément signé
            this.stat2Class = 'text-success';
            
            this.stat3Label = 'ROULEAUX';
            this.stat3Value = String(shiftData.rollCount || 0);
            this.stat3Class = 'text-info';
            
            this.stat4Label = 'TEMPS PERDU';
            this.stat4Value = `${shiftData.lostTime || 0} min`;
            this.stat4Class = 'text-info';
            
            // Infos du poste
            this.info1Label = 'ID Poste :';
            this.info1Value = shiftData.shiftId || '--';
            this.info2Label = 'Date :';
            this.info2Value = shiftData.date || '--';
            this.info3Label = 'Vacation :';
            this.info3Value = shiftData.vacation || '--';
        },
        
        // Afficher la modal
        show() {
            if (this.modalInstance) {
                this.modalInstance.show();
            }
        },
        
        // Masquer la modal
        hide() {
            if (this.modalInstance) {
                this.modalInstance.hide();
                
                // Si c'est un poste sauvegardé, recharger la page
                if (this.saveType === 'shift' && this.isSaved) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 300);
                }
            }
        },
        
        // Confirmer la sauvegarde
        async confirmSave() {
            // Éviter les doubles appels
            if (this.isSaving || this.isSaved) {
                return;
            }
            
            // Si c'est un poste, émettre l'événement approprié
            if (this.saveType === 'shift' && this.shiftConfirmEvent) {
                this.isSaving = true;
                window.dispatchEvent(new CustomEvent(this.shiftConfirmEvent));
                return;
            }
            
            // Sinon, comportement normal pour les rouleaux
            
            this.isSaving = true;
            
            try {
                // Émettre l'événement de confirmation avec les données
                window.dispatchEvent(new CustomEvent('confirm-roll-save', {
                    detail: {
                        rollId: this.rollId,
                        isNonConform: this.isNonConform,
                        // Ajouter d'autres données nécessaires pour la sauvegarde
                        length: this.length,
                        netMass: this.netMass,
                        weight: this.weight,
                        hasAllThicknesses: this.hasAllThicknesses,
                        defectCount: this.defectCount,
                        nokCount: this.nokCount
                    }
                }));
                
                // Ne PAS marquer comme sauvegardé ici - attendre la réponse
                // this.isSaved = true;  // Sera fait par l'événement roll-saved
                
                // Attendre que l'événement soit traité
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                this.isSaving = false;
                // TODO: Afficher un message d'erreur à l'utilisateur
            }
        },
        
        // Annuler
        cancelSave() {
            if (this.saveType === 'shift' && this.shiftCancelEvent) {
                window.dispatchEvent(new CustomEvent(this.shiftCancelEvent));
            }
            this.hide();
        }
    };
}