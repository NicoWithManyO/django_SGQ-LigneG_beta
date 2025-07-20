// Module d'aide et de calculs pour le composant rouleau
const rollHelpers = {
    // Obtenir les positions des épaisseurs pour le calcul du total
    getThicknessPositions(targetLength) {
        return rollBusinessLogic.getThicknessPositions(targetLength);
    },
    
    // Trouver le défaut épaisseur et son seuil
    getThicknessDefect(defectTypes) {
        return defectTypes.find(d => 
            d.name.toLowerCase().includes('épaisseur') || 
            d.name.toLowerCase().includes('epaisseur')
        );
    },
    
    // Obtenir l'ordre des colonnes
    getColumnOrder() {
        return ['length', 'G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
    },
    
    // Vérifier si une colonne est une colonne d'épaisseur
    isThicknessColumn(col) {
        return ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'].includes(col);
    },
    
    // Générer une clé unique pour une cellule
    getCellKey(row, col) {
        return `${row}-${col}`;
    },
    
    // Parser une clé de cellule
    parseCellKey(key) {
        const [row, col] = key.split('-');
        return { row: parseInt(row), col };
    },
    
    // Calculer le nombre total d'emplacements d'épaisseur possibles
    getTotalThicknessSlots(targetLength) {
        const positions = this.getThicknessPositions(targetLength);
        return positions.length * 6; // 6 colonnes par position
    }
};

// Exporter pour utilisation
window.rollHelpers = rollHelpers;