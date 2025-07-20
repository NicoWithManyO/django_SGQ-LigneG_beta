// Module de gestion de la conformité pour le composant rouleau
const rollConformity = {
    // Calculer la conformité du rouleau complet
    calculate(data) {
        const { defects, defectTypes, thicknesses, nokThicknesses, targetLength } = data;
        
        // Règle 1 : Défauts bloquants
        const hasBlockingDefect = defects.some(d => d.severity === 'blocking');
        if (hasBlockingDefect) {
            return false;
        }
        
        // Règle 2 : Défauts à seuil - vérifier si on dépasse le seuil
        for (const defectType of defectTypes) {
            if (defectType.severity === 'threshold' && defectType.threshold_value) {
                const count = defects.filter(d => d.typeId == defectType.id).length;
                if (count >= defectType.threshold_value) {
                    return false;
                }
            }
        }
        
        // Règle 3 : Plus de 3 cellules avec au moins une épaisseur NOK
        const cellsWithNokCount = rollBusinessLogic.countCellsWithNok(thicknesses, nokThicknesses);
        if (cellsWithNokCount > 3) {
            return false;
        }
        
        // Règle 4 : Une cellule avec 2 épaisseurs NOK
        const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
        const rowCount = rollBusinessLogic.calculateRowCount(targetLength);
        
        for (let row = 1; row <= rowCount; row++) {
            for (const col of cols) {
                if (this.hasTwoNokInCell(row, col, thicknesses, nokThicknesses)) {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    // Vérifier si une cellule a 2 épaisseurs NOK
    hasTwoNokInCell(row, col, thicknesses, nokThicknesses) {
        const hasNokBadge = nokThicknesses.some(nok => nok.row === row && nok.col === col);
        const hasNokInput = thicknesses.some(t => t.row === row && t.col === col && t.isNok);
        
        return hasNokBadge && hasNokInput;
    },
    
    // Trouver la dernière ligne avec un problème
    getLastProblemRow(data) {
        const { defects, thicknesses, nokThicknesses, targetLength } = data;
        let lastRow = 0;
        
        // Chercher la dernière ligne avec un défaut bloquant
        const blockingDefects = defects.filter(d => d.severity === 'blocking');
        blockingDefects.forEach(d => {
            if (d.row > lastRow) lastRow = d.row;
        });
        
        // Chercher la dernière ligne avec 2 épaisseurs NOK
        const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
        const rowCount = rollBusinessLogic.calculateRowCount(targetLength);
        
        for (let row = 1; row <= rowCount; row++) {
            for (const col of cols) {
                if (this.hasTwoNokInCell(row, col, thicknesses, nokThicknesses)) {
                    if (row > lastRow) lastRow = row;
                }
            }
        }
        
        // Si plus de 3 cellules avec NOK, chercher la dernière ligne avec épaisseur NOK
        const cellsWithNokCount = rollBusinessLogic.countCellsWithNok(thicknesses, nokThicknesses);
        if (cellsWithNokCount > 3) {
            // Trouver la dernière ligne avec une épaisseur NOK
            [...thicknesses, ...nokThicknesses].forEach(ep => {
                if ((ep.isNok || nokThicknesses.includes(ep)) && ep.row > lastRow) {
                    lastRow = ep.row;
                }
            });
        }
        
        return lastRow;
    }
};

// Exporter pour utilisation
window.rollConformity = rollConformity;