// Composant Alpine.js pour les onglets du profil
function profileTabs() {
    return {
        activeTab: 'kpi',
        
        // Initialisation
        init() {
            // Charger l'onglet actif depuis la session si disponible
            const savedTab = window.sessionStorage.getItem('profileActiveTab');
            if (savedTab && ['specs', 'kpi'].includes(savedTab)) {
                this.activeTab = savedTab;
            }
        },
        
        // Changer d'onglet
        switchTab(tab) {
            this.activeTab = tab;
            // Sauvegarder dans la session
            window.sessionStorage.setItem('profileActiveTab', tab);
            // Émettre un événement pour informer le composant profile
            window.dispatchEvent(new CustomEvent('profile-tab-changed', { 
                detail: { tab: tab } 
            }));
            
            // Dérouler le bloc s'il est enroulé
            const collapseElement = document.getElementById('collapseProfil');
            if (collapseElement && !collapseElement.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(collapseElement, {
                    show: true
                });
            }
        },
        
        // Vérifier si un onglet est actif
        isActive(tab) {
            return this.activeTab === tab;
        }
    };
}