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
    
    // Calculer le temps de fibrage
    calculateFibrageTime(startTime, currentTime = null) {
        // TODO: Implémenter le calcul du temps de fibrage
        return '--:--';
    }
};

// Exporter pour utilisation dans d'autres modules
window.RollCalculations = RollCalculations;