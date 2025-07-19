// Composant Alpine.js pour la checklist
function checklist() {
    return {
        // État
        loading: true,
        saving: false,
        items: [],
        responses: {},
        templateId: null,
        shiftId: null,
        signature: '',
        signatureTime: null,
        
        // Initialisation
        init() {
            // Charger le template depuis la session
            this.loadTemplateFromSession();
            
            // Charger la signature depuis la session
            this.loadSignatureFromSession();
            
            // Écouter les changements de session
            window.addEventListener('session-changed', () => {
                this.loadTemplateFromSession();
                this.loadSignatureFromSession();
                this.loadResponses();
            });
        },
        
        // Charger le template depuis la session
        async loadTemplateFromSession() {
            // Pour l'instant, toujours charger le template par défaut
            await this.loadTemplateItems(null);
        },
        
        // Charger les items d'un template
        async loadTemplateItems(profileId) {
            this.loading = true;
            
            try {
                // Pour l'instant, charger le template par défaut
                const data = await api.getChecklistTemplate();
                this.templateId = data.id;
                this.items = data.items || [];
                    
                    // Charger les réponses existantes si un shift est en cours
                    if (window.sessionData?.shift_id) {
                        this.shiftId = window.sessionData.shift_id;
                    }
                // Toujours charger les réponses (depuis sessionStorage ou API)
                await this.loadResponses();
            } catch (error) {
                console.error('Erreur chargement checklist:', error);
                // Charger des données de test
                this.loadTestData();
                // Charger les réponses après les données de test
                await this.loadResponses();
            } finally {
                this.loading = false;
            }
        },
        
        // Données de test pour développement
        loadTestData() {
            this.templateId = 1;
            this.items = [
                { id: 1, text: "Vérifier la présence et l'état des EPI", is_required: true },
                { id: 2, text: "Contrôler les dispositifs d'arrêt d'urgence", is_required: true },
                { id: 3, text: "Vérifier la propreté du poste de travail", is_required: true },
                { id: 4, text: "Contrôler l'état des outils et équipements", is_required: true },
                { id: 5, text: "Vérifier les niveaux machine", is_required: true },
                { id: 6, text: "Contrôler les paramètres selon fiche", is_required: true },
                { id: 7, text: "Vérifier les matières premières", is_required: true },
                { id: 8, text: "Contrôler le stock de consommables", is_required: false },
                { id: 9, text: "Lire les consignes du poste précédent", is_required: true },
                { id: 10, text: "Noter les anomalies dans le cahier", is_required: true }
            ];
        },
        
        // Charger les réponses existantes
        async loadResponses() {
            // Charger depuis la session API
            if (window.sessionData?.checklist_responses) {
                this.responses = window.sessionData.checklist_responses;
                console.log('Réponses chargées depuis la session:', this.responses);
            } else {
                // Si pas dans la session, initialiser vide
                this.responses = {};
            }
        },
        
        // Obtenir la réponse pour un item
        getResponse(itemId) {
            return this.responses[itemId] || '';
        },
        
        // Mettre à jour une réponse
        async updateResponse(itemId, value) {
            // Si on clique sur la même valeur, on la désactive
            if (this.responses[itemId] === value) {
                delete this.responses[itemId];
            } else {
                // Sinon on met à jour avec la nouvelle valeur
                this.responses[itemId] = value;
            }
            
            // Si on décoche un item et que la checklist était signée, effacer la signature
            if (!this.isAllItemsChecked && this.signature) {
                this.signature = '';
                this.signatureTime = null;
                // Sauvegarder dans la session
                await api.saveToSession({
                    checklist_signature: null,
                    checklist_signature_time: null
                });
            }
            
            // Sauvegarder dans la session API
            try {
                await api.saveToSession({
                    checklist_responses: this.responses
                });
                console.log('Réponses sauvegardées dans la session:', this.responses);
            } catch (error) {
                console.error('Erreur sauvegarde réponses:', error);
            }
        },
        
        // Vérifier s'il y a des items obligatoires
        get hasRequiredItems() {
            return this.items.some(item => item.is_required);
        },
        
        // Vérifier si tous les items ont un état
        get isAllItemsChecked() {
            return this.items.every(item => this.responses[item.id]);
        },
        
        // Vérifier si la checklist est complète (tous cochés + signé)
        get isChecklistComplete() {
            return this.isAllItemsChecked && this.signatureTime;
        },
        
        // Charger la signature depuis la session
        loadSignatureFromSession() {
            if (window.sessionData?.checklist_signature) {
                this.signature = window.sessionData.checklist_signature;
                this.signatureTime = window.sessionData.checklist_signature_time;
            }
        },
        
        // Sauvegarder la signature
        async saveSignature() {
            // S'assurer que signature est une chaîne avant toUpperCase
            this.signature = String(this.signature || '').toUpperCase();
            
            if (!this.signature) {
                // Si on efface la signature, effacer aussi l'heure
                this.signatureTime = null;
                await api.saveToSession({
                    checklist_signature: null,
                    checklist_signature_time: null
                });
                return;
            }
            
            try {
                // Générer l'heure actuelle
                const now = new Date();
                this.signatureTime = now.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                // Sauvegarder dans la session API
                await api.saveToSession({
                    checklist_signature: this.signature,
                    checklist_signature_time: this.signatureTime
                });
                console.log('Signature enregistrée:', this.signature, this.signatureTime);
            } catch (error) {
                console.error('Erreur sauvegarde signature:', error);
            }
        }
    };
}