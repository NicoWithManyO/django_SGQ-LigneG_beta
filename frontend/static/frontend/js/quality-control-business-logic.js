// Logique métier pour le contrôle qualité
const qualityControlBusinessLogic = {
    // Seuils par défaut (seront remplacés par les valeurs du profil)
    defaultThresholds: {
        micrometry: {
            min: 30,
            minAlert: 31,
            nominal: 32,
            maxAlert: 33,
            max: 34
        },
        surfaceMass: {
            min: 0.008,
            minAlert: 0.009,
            nominal: 0.010,
            maxAlert: 0.011,
            max: 0.012
        },
        dryExtract: {
            min: 0.20,
            minAlert: 0.22,
            nominal: 0.23,
            maxAlert: 0.24,
            max: 0.25
        }
    },
    
    // Calculer la moyenne d'un tableau de valeurs
    calculateAverage(values) {
        const validValues = values.filter(v => v !== null && !isNaN(v));
        if (validValues.length === 0) return null;
        
        const sum = validValues.reduce((acc, val) => acc + parseFloat(val), 0);
        return sum / validValues.length;
    },
    
    // Valider une mesure selon les seuils
    validateMeasure(value, thresholds) {
        if (value === null || isNaN(value)) return 'empty';
        
        const val = parseFloat(value);
        
        if (val < thresholds.min || val > thresholds.max) {
            return 'error'; // Rouge
        }
        
        if (val < thresholds.minAlert || val > thresholds.maxAlert) {
            return 'warning'; // Orange
        }
        
        return 'success'; // Vert
    },
    
    // Vérifier si toutes les mesures requises sont présentes
    hasRequiredMeasures(data) {
        // Vérifier que les données existent
        if (!data || !data.micrometry || !data.surfaceMass || !data.dryExtract) {
            return false;
        }
        
        // Toutes les micrométries doivent être remplies
        const microLeft = data.micrometry && data.micrometry.left && 
                         data.micrometry.left.filter(v => v !== null && v !== '' && v !== undefined).length === 3;
        const microRight = data.micrometry && data.micrometry.right && 
                          data.micrometry.right.filter(v => v !== null && v !== '' && v !== undefined).length === 3;
        
        // Toutes les masses surfaciques doivent être remplies
        const hasSurfaceMass = data.surfaceMass && 
                           data.surfaceMass.leftLeft !== null && data.surfaceMass.leftLeft !== '' &&
                           data.surfaceMass.leftCenter !== null && data.surfaceMass.leftCenter !== '' &&
                           data.surfaceMass.rightCenter !== null && data.surfaceMass.rightCenter !== '' &&
                           data.surfaceMass.rightRight !== null && data.surfaceMass.rightRight !== '';
        
        // L'extrait sec doit être rempli
        const hasDryExtract = data.dryExtract && data.dryExtract.value !== null && data.dryExtract.value !== '';
        
        // LOI doit être coché (true)
        const hasLOI = data.dryExtract && data.dryExtract.sample === true;
        
        return microLeft && microRight && hasSurfaceMass && hasDryExtract && hasLOI;
    },
    
    // Calculer le statut global du contrôle qualité
    calculateQCStatus(data, thresholds = null) {
        // Vérifier que les données existent
        if (!data || !data.micrometry || !data.surfaceMass || !data.dryExtract) {
            return 'pending';
        }
        
        if (!this.hasRequiredMeasures(data)) {
            return 'pending';
        }
        
        const th = thresholds || this.defaultThresholds;
        let hasError = false;
        let hasWarning = false;
        
        // Vérifier les micrométries
        if (data.micrometry.left && data.micrometry.right) {
            const avgLeft = this.calculateAverage(data.micrometry.left);
            const avgRight = this.calculateAverage(data.micrometry.right);
            
            if (avgLeft !== null) {
                const status = this.validateMeasure(avgLeft, th.micrometry);
                if (status === 'error') hasError = true;
                if (status === 'warning') hasWarning = true;
            }
            
            if (avgRight !== null) {
                const status = this.validateMeasure(avgRight, th.micrometry);
                if (status === 'error') hasError = true;
                if (status === 'warning') hasWarning = true;
            }
        }
        
        // Vérifier les masses surfaciques si présentes
        if (data.surfaceMass) {
            ['LL', 'LC', 'RC', 'RR'].forEach(key => {
                if (data.surfaceMass[key] !== null) {
                    const status = this.validateMeasure(data.surfaceMass[key], th.surfaceMass);
                    if (status === 'error') hasError = true;
                    if (status === 'warning') hasWarning = true;
                }
            });
        }
        
        // Vérifier l'extrait sec si présent
        if (data.dryExtract && data.dryExtract.value !== null) {
            const status = this.validateMeasure(data.dryExtract.value, th.dryExtract);
            if (status === 'error') hasError = true;
            if (status === 'warning') hasWarning = true;
        }
        
        if (hasError) return 'failed';
        // Ignorer les warnings pour le badge - seulement passed ou failed
        return 'passed';
    }
};

// Exporter pour utilisation
window.qualityControlBusinessLogic = qualityControlBusinessLogic;