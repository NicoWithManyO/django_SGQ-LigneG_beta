// Module de calculs pour les rouleaux
const RollCalculations = {
    // Largeur par défaut du feutre en mètres
    DEFAULT_FELT_WIDTH: 1,
    
    // Calculer la masse nette
    calculateNetMass(totalMass, tubeMass) {
        const total = parseFloat(totalMass) || 0;
        const tube = parseFloat(tubeMass) || 0;
        
        if (total > 0 && tube > 0 && total > tube) {
            return total - tube;
        }
        return null;
    },
    
    // Calculer le grammage
    calculateGrammage(netMass, length, feltWidth = null) {
        const mass = parseFloat(netMass) || 0;
        const len = parseFloat(length) || 0;
        const width = parseFloat(feltWidth) || this.DEFAULT_FELT_WIDTH;
        
        if (mass > 0 && len > 0 && width > 0) {
            const surface = len * width;
            const grammageValue = mass / surface;
            return grammageValue.toFixed(1) + ' g/m²';
        }
        return null;
    },
    
    // Générer l'ID du rouleau
    generateRollId(ofNumber, rollNumber) {
        if (ofNumber && rollNumber) {
            return `${ofNumber}_${String(rollNumber).padStart(3, '0')}`;
        }
        return null;
    },
    
    // Générer l'ID pour un rouleau non conforme (vers découpe)
    generateCuttingRollId(cuttingOrderNumber, forDisplay = true) {
        if (!cuttingOrderNumber) {
            return null;
        }
        
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        
        if (forDisplay) {
            // Format pour l'affichage : OfDecoupe_DDMMAA
            return `${cuttingOrderNumber}_${day}${month}${year}`;
        } else {
            // Format pour la sauvegarde : OfDecoupe_DDMMAA_HHMM
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${cuttingOrderNumber}_${day}${month}${year}_${hours}${minutes}`;
        }
    },
    
    // Calculer le temps de fibrage
    calculateFibrageTime(startTime, currentTime = null) {
        // À FAIRE: Implémenter le calcul du temps de fibrage
        return '--:--';
    }
};

// Exporter pour utilisation dans d'autres modules
window.RollCalculations = RollCalculations;