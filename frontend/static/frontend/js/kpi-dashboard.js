// Composant Alpine.js pour gérer les KPI en temps réel
Alpine.data('kpiDashboard', () => ({
    // Données
    openingTime: 480, // TO en minutes (8h par défaut)
    totalLostTime: 0, // TPD en minutes
    availableTime: 480, // TD en minutes
    availabilityRate: '100.0', // Taux de disponibilité en %
    
    // Production
    totalLength: 0, // Production totale en mètres
    conformRolls: 0, // Nombre de rouleaux conformes
    totalRolls: 0, // Nombre total de rouleaux
    
    // Vitesse ligne
    beltSpeed: 0, // Vitesse en m/min depuis le profil
    
    init() {
        console.log('Initialisation du dashboard KPI');
        console.log('sessionData:', window.sessionData);
        
        // Calculer les KPI au chargement
        this.updateKPIs();
        
        // Écouter les changements de session (incluant les heures)
        window.addEventListener('session-updated', (e) => {
            console.log('Session mise à jour, recalcul des KPI');
            this.updateKPIs();
        });
        
        // Écouter les changements de temps perdus
        window.addEventListener('lost-time-updated', (e) => {
            console.log('Temps perdus mis à jour:', e.detail);
            this.totalLostTime = e.detail.total || 0;
            this.updateKPIs();
        });
        
        // Écouter les changements de production (rouleaux)
        window.addEventListener('roll-created', (e) => {
            console.log('Nouveau rouleau créé');
            this.updateProductionData();
        });
        
        // Écouter les changements de profil
        window.addEventListener('profile-changed', (e) => {
            console.log('Profil changé');
            this.updateBeltSpeed();
            this.updateKPIs();
        });
    },
    
    updateKPIs() {
        // Calculer TO depuis sessionData
        const startTime = window.sessionData?.start_time;
        const endTime = window.sessionData?.end_time;
        const vacation = window.sessionData?.vacation;
        
        if (startTime && endTime) {
            this.openingTime = this.calculateDuration(startTime, endTime, vacation);
        }
        
        // TD = TO - TPD
        this.availableTime = Math.max(0, this.openingTime - this.totalLostTime);
        
        // Taux de disponibilité
        this.availabilityRate = this.openingTime > 0 ? 
            ((this.availableTime / this.openingTime) * 100).toFixed(1) : '0.0';
        
        // Calculer les autres taux
        this.updatePerformanceRate();
        this.updateQualityRate();
        this.updateOEE();
        
        console.log('KPI mis à jour:', {
            TO: this.openingTime,
            TPD: this.totalLostTime,
            TD: this.availableTime,
            Disponibilité: this.availabilityRate + '%'
        });
    },
    
    calculateDuration(startTime, endTime, vacation = 'Journee') {
        // Parser les heures
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        // Créer des objets Date pour calculer
        const startDate = new Date();
        startDate.setHours(startHour, startMin, 0, 0);
        
        const endDate = new Date();
        endDate.setHours(endHour, endMin, 0, 0);
        
        // Pour les vacations de nuit, ajouter un jour à la fin
        if (vacation === 'Nuit' && endHour < startHour) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        // Calculer la différence en minutes
        const diffMs = endDate - startDate;
        return Math.max(0, Math.floor(diffMs / 60000)); // millisecondes vers minutes
    },
    
    updatePerformanceRate() {
        // Production théorique = vitesse × temps disponible
        const theoreticalOutput = this.beltSpeed * this.availableTime;
        
        // Taux de performance
        this.performanceRate = theoreticalOutput > 0 ?
            ((this.totalLength / theoreticalOutput) * 100).toFixed(1) : 0;
    },
    
    updateQualityRate() {
        // Taux de qualité = rouleaux conformes / rouleaux totaux
        this.qualityRate = this.totalRolls > 0 ?
            ((this.conformRolls / this.totalRolls) * 100).toFixed(1) : 100;
    },
    
    updateOEE() {
        // TRS/OEE = Disponibilité × Performance × Qualité / 10000
        const availability = parseFloat(this.availabilityRate) || 0;
        const performance = parseFloat(this.performanceRate) || 0;
        const quality = parseFloat(this.qualityRate) || 0;
        
        this.oeeRate = ((availability * performance * quality) / 10000).toFixed(1);
    },
    
    updateProductionData() {
        // TODO: Récupérer les données de production depuis l'API ou la session
        // Pour l'instant, utiliser des valeurs de test
        this.totalLength = 1200; // mètres
        this.conformRolls = 8;
        this.totalRolls = 9;
        
        this.updateQualityRate();
        this.updatePerformanceRate();
        this.updateOEE();
    },
    
    updateBeltSpeed() {
        // TODO: Récupérer la vitesse depuis le profil actuel
        // Pour l'instant, utiliser une valeur par défaut
        this.beltSpeed = 15; // m/min
        
        this.updatePerformanceRate();
        this.updateOEE();
    },
    
    // Getters pour le formatage
    get formattedAvailableTime() {
        const hours = Math.floor(this.availableTime / 60);
        const minutes = this.availableTime % 60;
        return hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes} min`;
    },
    
    get availabilityDetails() {
        return `${this.availableTime} min / ${this.openingTime} min`;
    },
    
    // Format pour éviter les problèmes d'affichage
    get formattedAvailabilityRate() {
        return this.availabilityRate || '0.0';
    }
}));