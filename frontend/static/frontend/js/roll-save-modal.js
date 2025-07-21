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
        modalInstance: null,
        
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
            
            // Réinitialiser quand la modal se ferme
            modalElement?.addEventListener('hidden.bs.modal', () => {
                this.isSaved = false;
            });
            
        },
        
        // Mettre à jour les données de la modal
        updateModalData(data) {
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
            }
        },
        
        // Confirmer la sauvegarde
        async confirmSave() {
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
                
                // Marquer comme sauvegardé
                this.isSaved = true;
                
                // Placeholder pour la logique de sauvegarde
                // TODO: Implémenter la sauvegarde réelle
                console.log('Sauvegarde simulée:', this.rollId);
                
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                // TODO: Afficher un message d'erreur à l'utilisateur
            }
        }
    };
}