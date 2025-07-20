// Module de formatage pour le composant rouleau
const rollFormatters = {
    // Formater le code d'un défaut pour affichage
    formatDefectCode(defectName) {
        if (!defectName) return '';
        
        // Utiliser la logique métier
        return rollBusinessLogic.formatDefectCode(defectName);
    },
    
    // Obtenir la valeur de l'épaisseur OK formatée
    formatThicknessValue(thickness) {
        if (!thickness) return '';
        
        let valueStr = thickness.value.toString().replace('.', ',');
        
        // Si on a plus d'une décimale, arrondir inférieur à 1 décimale
        if (valueStr.includes(',') && valueStr.split(',')[1].length > 1) {
            const rounded = Math.floor(thickness.value * 10) / 10;
            return rounded.toString().replace('.', ',');
        }
        
        // Si c'est un entier, ajouter ,0
        return valueStr + ',0';
    },
    
    // Formater la liste des défauts avec compteurs
    formatDefectsList(defects) {
        if (!defects || defects.length === 0) return '--';
        
        // Grouper par type de défaut et compter
        const defectCounts = {};
        defects.forEach(d => {
            const name = d.typeName || 'Inconnu';
            defectCounts[name] = (defectCounts[name] || 0) + 1;
        });
        
        // Formater la liste
        return Object.entries(defectCounts)
            .map(([name, count]) => count > 1 ? `${name} (${count})` : name)
            .join(', ');
    }
};

// Exporter pour utilisation
window.rollFormatters = rollFormatters;