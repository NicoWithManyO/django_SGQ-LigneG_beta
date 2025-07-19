// Logique métier pour le composant rouleau
// Séparé du composant UI pour meilleure maintenabilité

const rollBusinessLogic = {
    // Calculer si une ligne doit avoir des inputs d'épaisseur
    isThicknessRow(row, targetLength) {
        // Règles métier :
        // - Si longueur < 3m : épaisseur ligne 1
        // - Si longueur >= 3m : épaisseur ligne 3, puis tous les 5m (8, 13, 18...)
        
        if (targetLength < 3) {
            return row === 1;
        }
        
        // Première épaisseur à 3m
        if (row === 3) return true;
        
        // Puis tous les 5m après 3m
        return row > 3 && (row - 3) % 5 === 0;
    },
    
    // Calculer le nombre de lignes à afficher selon la longueur cible
    calculateRowCount(targetLength) {
        // Adapter le nombre de lignes à la longueur cible
        targetLength = parseInt(targetLength) || 0;
        
        // Si pas de longueur cible, ne pas afficher de rouleau
        if (targetLength === 0) {
            return 0;
        }
        
        // Afficher exactement le nombre de lignes correspondant à la longueur (max 100)
        return Math.min(100, targetLength);
    },
    
    // Calculer la conformité du rouleau
    calculateConformity(defectCount, thicknesses, nokThicknesses) {
        // Règles de conformité :
        // - Non conforme si au moins 1 défaut
        // - Non conforme si une cellule a 2 épaisseurs NOK (non rattrapée)
        
        // Vérifier les défauts
        if (defectCount > 0) {
            return false;
        }
        
        // Vérifier les cellules avec 2 NOK
        // Grouper par position (row, col)
        const cellNokCount = {};
        
        // Compter les NOK par cellule
        nokThicknesses.forEach(nok => {
            const key = `${nok.row}-${nok.col}`;
            cellNokCount[key] = (cellNokCount[key] || 0) + 1;
        });
        
        // Compter les épaisseurs NOK dans les inputs
        thicknesses.forEach(thickness => {
            if (thickness.isNok) {
                const key = `${thickness.row}-${thickness.col}`;
                cellNokCount[key] = (cellNokCount[key] || 0) + 1;
            }
        });
        
        // Si une cellule a 2 NOK ou plus : non conforme
        for (const count of Object.values(cellNokCount)) {
            if (count >= 2) {
                return false;
            }
        }
        
        return true;
    },
    
    // Valider une épaisseur selon les spécifications
    validateThickness(value, specifications = {}) {
        const {
            min = 0,
            minAlert = 3,
            nominal = 5,
            maxAlert = 7,
            max = 10,
            isBlocking = false
        } = specifications;
        
        // Statuts possibles : 'ok', 'alert', 'nok'
        if (value < min || value > max) {
            return { status: 'nok', isBlocking };
        }
        
        if (value < minAlert || value > maxAlert) {
            return { status: 'alert', isBlocking: false };
        }
        
        return { status: 'ok', isBlocking: false };
    },
    
    // Formater le code d'un défaut pour affichage
    formatDefectCode(defectName) {
        if (!defectName) return '';
        
        // Prendre les 3 premières lettres en majuscules
        // Gérer les cas spéciaux
        const specialCases = {
            'Trou': 'TRO',
            'Déchirure': 'DEC',
            'Tache': 'TAC',
            'Pli': 'PLI',
            'Corps étranger': 'CE',
            'Surépaisseur': 'SUR',
            'Manque matière': 'MM'
        };
        
        return specialCases[defectName] || defectName.substring(0, 3).toUpperCase();
    },
    
    // Calculer les positions des épaisseurs pour un rouleau
    getThicknessPositions(targetLength) {
        const positions = [];
        
        if (targetLength < 3) {
            positions.push(1);
        } else {
            // Première à 3m
            positions.push(3);
            
            // Puis tous les 5m
            for (let row = 8; row <= targetLength; row += 5) {
                positions.push(row);
            }
        }
        
        return positions;
    }
};

// Exporter pour utilisation dans les composants
window.rollBusinessLogic = rollBusinessLogic;