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
        signatureInvalid: false,
        
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
            
            // Écouter les changements d'opérateur
            window.addEventListener('operator-changed', () => {
                // Effacer la signature si elle existe
                if (this.signature) {
                    this.signature = '';
                    this.signatureTime = null;
                    this.signatureInvalid = false;
                    // Sauvegarder l'effacement
                    api.saveToSession({
                        checklist_signature: null,
                        checklist_signature_time: null
                    });
                }
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
        
        // Obtenir les initiales attendues depuis le champ opérateur
        getExpectedInitials() {
            // Récupérer le select de l'opérateur
            const operatorSelect = document.querySelector('select[x-model="operatorId"]');
            if (!operatorSelect || !operatorSelect.selectedOptions[0]) return null;
            
            // Récupérer le texte de l'option sélectionnée (format: "Prénom NOM")
            const operatorText = operatorSelect.selectedOptions[0].text;
            if (!operatorText || operatorText === '--') return null;
            
            // Extraire prénom et nom
            const parts = operatorText.split(' ');
            if (parts.length < 2) return null;
            
            // Première lettre du prénom + première lettre du nom
            return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
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
                // Émettre l'événement pour notifier le changement
                window.dispatchEvent(new CustomEvent('checklist-status-changed', {
                    detail: { signed: false, complete: this.isAllItemsChecked }
                }));
                return;
            }
            
            // Vérifier que les initiales correspondent
            const expectedInitials = this.getExpectedInitials();
            if (expectedInitials && this.signature !== expectedInitials) {
                this.signatureInvalid = true;
                this.signatureTime = null;
                // Sauvegarder l'état invalide
                await api.saveToSession({
                    checklist_signature: this.signature,
                    checklist_signature_time: null
                });
                // Émettre l'événement pour notifier le changement
                window.dispatchEvent(new CustomEvent('checklist-status-changed', {
                    detail: { signed: false, complete: this.isAllItemsChecked }
                }));
                return;
            }
            
            // Signature valide
            this.signatureInvalid = false;
            
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
                
                // Émettre l'événement pour notifier que la checklist est signée
                window.dispatchEvent(new CustomEvent('checklist-status-changed', {
                    detail: { signed: true, complete: this.isChecklistComplete }
                }));
            } catch (error) {
                console.error('Erreur sauvegarde signature:', error);
            }
        }
    };
}