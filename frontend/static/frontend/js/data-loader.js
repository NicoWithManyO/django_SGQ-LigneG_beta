// Module centralisé pour le chargement des données
// Évite les appels API multiples au démarrage

const dataLoader = {
    // Cache pour les données statiques
    cache: {
        defectTypes: null,
        lostTimeReasons: null,
        checklistTemplate: null
    },
    
    // Charger toutes les données nécessaires au démarrage
    async loadInitialData() {
        try {
            // Charger en parallèle pour gagner du temps
            const [
                defectTypes,
                lostTimeReasons,
                checklistTemplate,
                lostTimeEntries,
                checklistResponses
            ] = await Promise.all([
                // Données catalogue (cachables)
                this.loadDefectTypes(),
                this.loadLostTimeReasons(),
                this.loadChecklistTemplate(),
                // Données spécifiques au shift (non cachables)
                this.loadLostTimeEntries(),
                this.loadChecklistResponses()
            ]);
            
            return {
                defectTypes,
                lostTimeReasons,
                checklistTemplate,
                lostTimeEntries,
                checklistResponses
            };
        } catch (error) {
            console.error('Erreur chargement données initiales:', error);
            throw error;
        }
    },
    
    // Charger les types de défauts (avec cache)
    async loadDefectTypes() {
        if (this.cache.defectTypes) {
            return this.cache.defectTypes;
        }
        
        try {
            const response = await fetch('/api/defect-types/');
            if (response.ok) {
                this.cache.defectTypes = await response.json();
                return this.cache.defectTypes;
            }
        } catch (error) {
            console.error('Erreur chargement types défauts:', error);
        }
        
        // Données de fallback
        return [
            { id: 1, name: "Trou" },
            { id: 2, name: "Déchirure" },
            { id: 3, name: "Tache" },
            { id: 4, name: "Pli" },
            { id: 5, name: "Corps étranger" },
            { id: 6, name: "Surépaisseur" },
            { id: 7, name: "Manque matière" }
        ];
    },
    
    // Charger les motifs de temps perdu (avec cache)
    async loadLostTimeReasons() {
        if (this.cache.lostTimeReasons) {
            return this.cache.lostTimeReasons;
        }
        
        try {
            const response = await fetch('/api/lost-time-reasons/');
            if (response.ok) {
                this.cache.lostTimeReasons = await response.json();
                return this.cache.lostTimeReasons;
            }
        } catch (error) {
            console.error('Erreur chargement motifs:', error);
        }
        
        return [];
    },
    
    // Charger le template de checklist (avec cache)
    async loadChecklistTemplate() {
        if (this.cache.checklistTemplate) {
            return this.cache.checklistTemplate;
        }
        
        try {
            const response = await fetch('/api/checklist-template-default/');
            if (response.ok) {
                this.cache.checklistTemplate = await response.json();
                return this.cache.checklistTemplate;
            }
        } catch (error) {
            console.error('Erreur chargement template:', error);
        }
        
        return { items: [] };
    },
    
    // Charger les entrées de temps perdu (pas de cache)
    async loadLostTimeEntries() {
        const shiftId = window.sessionData?.shift_id;
        if (!shiftId) return [];
        
        try {
            const response = await fetch(`/api/lost-time-entries/?shift_id=${shiftId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erreur chargement arrêts:', error);
        }
        
        return [];
    },
    
    // Charger les réponses checklist (pas de cache)
    async loadChecklistResponses() {
        const shiftId = window.sessionData?.shift_id;
        if (!shiftId) return [];
        
        try {
            const response = await fetch(`/api/checklist-responses/?shift_id=${shiftId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erreur chargement réponses:', error);
        }
        
        return [];
    },
    
    // Vider le cache (utile au changement de shift)
    clearCache() {
        this.cache = {
            defectTypes: null,
            lostTimeReasons: null,
            checklistTemplate: null
        };
    }
};

// Store Alpine.js global pour partager les données
document.addEventListener('alpine:init', () => {
    Alpine.store('appData', {
        defectTypes: [],
        lostTimeReasons: [],
        checklistTemplate: { items: [] },
        lostTimeEntries: [],
        checklistResponses: [],
        isLoading: true,
        
        async init() {
            try {
                const data = await dataLoader.loadInitialData();
                Object.assign(this, data);
                this.isLoading = false;
                
                // Émettre un événement pour notifier que les données sont prêtes
                window.dispatchEvent(new CustomEvent('app-data-loaded', { detail: data }));
            } catch (error) {
                console.error('Erreur initialisation données:', error);
                this.isLoading = false;
            }
        }
    });
});

// Exporter pour utilisation
window.dataLoader = dataLoader;