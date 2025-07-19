// Composant Alpine.js pour le rouleau
function roll() {
    return {
        // État
        targetLength: 0,
        rowCount: 12, // Nombre de lignes à afficher (basé sur longueur cible)
        thicknessCount: 0,
        nokCount: 0,
        defectCount: 0,
        thicknesses: [],
        nokThicknesses: [], // Épaisseurs rejetées
        defects: [],
        defectTypes: [], // Types de défauts depuis Django
        selectedDefectType: null,
        showDefectSelector: false,
        currentCell: null,
        selectorPosition: { top: 0, left: 0 },
        
        // Initialisation
        init() {
            // Charger la longueur cible depuis la session
            this.loadTargetLength();
            
            // Charger les données du rouleau depuis la session
            this.loadRollData();
            
            // Charger les types de défauts
            this.loadDefectTypes();
            
            // Écouter les changements
            window.addEventListener('target-length-changed', (e) => {
                this.targetLength = e.detail.length;
                this.updateGrid();
            });
            
            // Écouter la validation des épaisseurs (blur ou Enter)
            this.$el.addEventListener('blur', (e) => {
                if (e.target.classList.contains('thickness-input') && !e.target.dataset.processing) {
                    this.handleThicknessInput(e.target);
                }
            }, true);
            
            this.$el.addEventListener('keydown', (e) => {
                if (e.target.classList.contains('thickness-input')) {
                    if (e.key === 'Enter') {
                        this.handleThicknessInput(e.target);
                        e.target.blur();
                    } else if (e.key === 'Tab') {
                        e.preventDefault();
                        this.navigateToNextEpaisseur(e.target, e.shiftKey);
                    }
                }
            });
        },
        
        // Obtenir la liste des colonnes dans l'ordre
        getColumns() {
            return ['G1', 'C1', 'D1', 'length', 'G2', 'C2', 'D2'];
        },
        
        // Charger la longueur cible
        loadTargetLength() {
            if (window.sessionData?.target_length) {
                this.targetLength = parseInt(window.sessionData.target_length);
                this.updateGrid();
            }
        },
        
        // Charger les données du rouleau depuis la session
        loadRollData() {
            if (window.sessionData?.roll_data) {
                const rollData = window.sessionData.roll_data;
                this.thicknesses = rollData.thicknesses || [];
                this.nokThicknesses = rollData.nokThicknesses || [];
                this.defects = rollData.defects || [];
                this.thicknessCount = this.thicknesses.length;
                this.nokCount = this.nokThicknesses.length;
                this.defectCount = this.defects.length;
                
                // Restaurer les valeurs dans les inputs
                this.$nextTick(() => {
                    this.restoreInputValues();
                });
            }
        },
        
        // Restaurer les valeurs dans les inputs d'épaisseur
        restoreInputValues() {
            this.thicknesses.forEach(thickness => {
                const input = this.$el.querySelector(`input[data-row="${thickness.row}"][data-col="${thickness.col}"]`);
                if (input) {
                    input.value = thickness.value.toString().replace('.', ',');
                }
            });
        },
        
        // Sauvegarder les données du rouleau dans la session
        async saveRollData() {
            const rollData = {
                thicknesses: this.thicknesses,
                nokThicknesses: this.nokThicknesses,
                defects: this.defects
            };
            
            try {
                await api.saveToSession({ roll_data: rollData });
            } catch (error) {
                console.error('Erreur sauvegarde données rouleau:', error);
            }
        },
        
        // Mettre à jour la grille
        updateGrid() {
            // Utiliser la logique métier pour calculer le nombre de lignes
            this.rowCount = rollBusinessLogic.calculateRowCount(this.targetLength);
            
            // Émettre un événement pour notifier du changement
            this.$dispatch('grid-updated', { rows: this.rowCount });
            
            console.log(`Grille mise à jour : ${this.rowCount} lignes pour ${this.targetLength}m`);
        },
        
        
        // Ajouter un défaut
        addDefect(position, type) {
            this.defects.push({ position, type });
            this.defectCount = this.defects.length;
        },
        
        // Calculer la conformité
        get isConform() {
            // Utiliser la logique métier pour calculer la conformité
            return rollBusinessLogic.calculateConformity(
                this.defectCount,
                this.thicknesses,
                this.nokThicknesses
            );
        },
        
        // Vérifier si une ligne doit avoir des inputs d'épaisseur
        isThicknessRow(row) {
            // Utiliser la logique métier
            return rollBusinessLogic.isThicknessRow(row, this.targetLength);
        },
        
        // Charger les types de défauts depuis le store global
        loadDefectTypes() {
            // Utiliser le store Alpine global au lieu d'un appel API
            const appData = Alpine.store('appData');
            if (appData && appData.defectTypes.length > 0) {
                this.defectTypes = appData.defectTypes;
            } else {
                // Écouter l'événement si les données ne sont pas encore chargées
                window.addEventListener('app-data-loaded', (e) => {
                    this.defectTypes = e.detail.defectTypes;
                }, { once: true });
            }
        },
        
        // Ouvrir le sélecteur de défauts
        openDefectSelector(event, row, col) {
            console.log('openDefectSelector called:', row, col, event);
            
            // Si on clique sur l'input d'épaisseur, ne rien faire
            if (event.target.classList.contains('thickness-input')) {
                return;
            }
            
            // Stopper la propagation pour éviter les conflits
            event.stopPropagation();
            
            this.currentCell = { row, col };
            
            // Si la cellule a déjà un défaut, on pré-sélectionne le défaut existant
            const existingDefect = this.defects.find(d => d.row === row && d.col === col);
            this.selectedDefectType = existingDefect ? existingDefect.typeId : '';
            
            // Obtenir le bouton cliqué
            const button = event.target;
            const buttonRect = button.getBoundingClientRect();
            
            // Position du sélecteur (position fixed, donc coordonnées de la fenêtre)
            this.selectorPosition = {
                top: buttonRect.bottom + 2, // 2px sous le bouton
                left: buttonRect.left - 50 // Centrer le sélecteur
            };
            
            console.log('Button rect:', buttonRect);
            console.log('Selector position:', this.selectorPosition);
            
            this.showDefectSelector = true;
            
            // Focus sur le select après le rendu
            this.$nextTick(() => {
                const selector = document.querySelector('.defect-selector');
                if (selector) {
                    selector.focus();
                }
            });
        },
        
        // Ajouter un défaut
        addDefect() {
            if (!this.selectedDefectType || !this.currentCell) return;
            
            const defect = {
                row: this.currentCell.row,
                col: this.currentCell.col,
                typeId: this.selectedDefectType,
                typeName: this.defectTypes.find(d => d.id == this.selectedDefectType)?.name
            };
            
            this.defects.push(defect);
            this.defectCount = this.defects.length;
            this.showDefectSelector = false;
            
            // Mettre à jour l'affichage
            this.updateCellDisplay(this.currentCell.row, this.currentCell.col);
            
            // Sauvegarder dans la session
            this.saveRollData();
            
            // Émettre un événement pour mettre à jour le badge
            window.dispatchEvent(new CustomEvent('rouleau-updated', {
                detail: { 
                    thicknessCount: this.thicknessCount,
                    nokCount: this.nokCount,
                    defectCount: this.defectCount
                }
            }));
        },
        
        // Mettre à jour l'affichage d'une cellule
        updateCellDisplay(row, col) {
            // L'affichage est géré automatiquement par Alpine.js via les bindings
            console.log('Défaut ajouté:', row, col);
        },
        
        // Vérifier si une cellule a un défaut
        hasDefect(row, col) {
            return this.defects.some(d => d.row === row && d.col === col);
        },
        
        // Obtenir le code du défaut pour affichage
        getDefectCode(row, col) {
            const defect = this.defects.find(d => d.row === row && d.col === col);
            if (defect && defect.typeName) {
                // Utiliser la logique métier pour formater le code
                return rollBusinessLogic.formatDefectCode(defect.typeName);
            }
            return '';
        },
        
        // Supprimer un défaut
        removeDefect(row, col) {
            // Pour l'instant, supprimer directement sans animation
            const index = this.defects.findIndex(d => d.row === row && d.col === col);
            if (index > -1) {
                this.defects.splice(index, 1);
                this.defectCount = this.defects.length;
                
                // Sauvegarder dans la session
                this.saveRollData();
                
                // Émettre un événement pour mettre à jour le badge
                window.dispatchEvent(new CustomEvent('rouleau-updated', {
                    detail: { 
                        thicknessCount: this.thicknessCount,
                        nokCount: this.nokCount,
                        defectCount: this.defectCount
                    }
                }));
            }
        },
        
        // Vérifier si une ligne a au moins un défaut
        hasDefectInRow(row) {
            // Une ligne a un défaut si elle a un défaut visuel OU une cellule avec 2 épaisseurs NOK
            if (this.defects.some(d => d.row === row)) {
                return true;
            }
            
            // Vérifier si une cellule de cette ligne a 2 épaisseurs NOK
            const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
            for (const col of cols) {
                // Si on a un badge NOK ET un input NOK dans la même cellule
                if (this.hasThicknessNok(row, col) && this.hasThicknessNokInInput(row, col)) {
                    return true;
                }
            }
            
            return false;
        },
        
        // Gérer la saisie d'épaisseur
        handleThicknessInput(input) {
            // Remplacer la virgule par un point pour parseFloat
            const inputValue = input.value.trim().replace(',', '.');
            const value = parseFloat(inputValue);
            const row = parseInt(input.dataset.row);
            const col = input.dataset.col;
            
            // Si l'input est vide, supprimer toute épaisseur (OK ou NOK)
            if (inputValue === '') {
                this.removeThickness(row, col);
                return;
            }
            
            if (!isNaN(value)) {
                // Vérifier si l'épaisseur est NOK (< 5 pour le test)
                if (value < 5) {
                    // Vérifier si c'est la première NOK de la cellule
                    const hasNokInCell = this.nokThicknesses.some(e => e.row === row && e.col === col);
                    
                    if (!hasNokInCell) {
                        // D'abord supprimer toute ancienne valeur seulement si c'est la première NOK
                        this.removeThickness(row, col);
                        // Première NOK : badge rouge normal
                        this.nokThicknesses.push({
                            row: row,
                            col: col,
                            value: value
                        });
                        this.nokCount = this.nokThicknesses.length;
                        
                        // Marquer l'input comme en cours de traitement pour éviter le double traitement
                        input.dataset.processing = 'true';
                        
                        // Vider l'input pour permettre la saisie de rattrapage
                        input.value = '';
                        
                        // Retirer le marqueur après un court délai
                        setTimeout(() => {
                            delete input.dataset.processing;
                        }, 100);
                    } else {
                        // Deuxième NOK dans la même cellule : garder dans l'input mais en rouge
                        // ET marquer comme NON CONFORME car 2 NOK dans la même cellule
                        
                        // Chercher si on a déjà une épaisseur NOK dans l'input
                        const existingIndex = this.thicknesses.findIndex(e => e.row === row && e.col === col && e.isNok);
                        
                        if (existingIndex !== -1) {
                            // Mettre à jour directement la valeur NOK existante
                            this.thicknesses[existingIndex].value = value;
                        } else {
                            // Supprimer toute ancienne valeur OK avant d'ajouter la NOK
                            this.removeThickness(row, col);
                            
                            this.thicknesses.push({
                                row: row,
                                col: col,
                                value: value,
                                isNok: true  // Marquer comme NOK pour le style
                            });
                            this.thicknessCount = this.thicknesses.length;
                        }
                        // Pas d'incrémentation de nbNok ici car c'est la 2e NOK de la même cellule
                        
                        // Garder la valeur dans l'input
                        input.value = inputValue; // Garder la valeur originale avec virgule
                    }
                    
                    // Mettre à jour l'affichage
                    this.updateEpaisseurDisplay();
                } else {
                    // Épaisseur OK
                    this.addThickness(row, col, value);
                }
            }
        },
        
        // Vérifier si une cellule a une épaisseur NOK
        hasThicknessNok(row, col) {
            return this.nokThicknesses.some(e => e.row === row && e.col === col);
        },
        
        // Obtenir la valeur de l'épaisseur NOK
        getThicknessNok(row, col) {
            const ep = this.nokThicknesses.find(e => e.row === row && e.col === col);
            if (ep) {
                // Convertir en string et remplacer le point par une virgule
                const valueStr = ep.value.toString().replace('.', ',');
                
                // Si on a déjà une virgule avec une décimale, garder tel quel
                if (valueStr.includes(',') && valueStr.split(',')[1].length === 1) {
                    return valueStr;
                }
                
                // Si on a plus d'une décimale, arrondir inférieur à 1 décimale
                if (valueStr.includes(',') && valueStr.split(',')[1].length > 1) {
                    const rounded = Math.floor(ep.value * 10) / 10;
                    return rounded.toString().replace('.', ',');
                }
                
                // Si c'est un entier, ajouter ,0
                return valueStr + ',0';
            }
            return '';
        },
        
        // Mettre à jour l'affichage des épaisseurs
        updateEpaisseurDisplay() {
            // Sauvegarder dans la session
            this.saveRollData();
            
            // Émettre un événement pour mettre à jour le badge
            window.dispatchEvent(new CustomEvent('rouleau-updated', {
                detail: { 
                    thicknessCount: this.thicknessCount,
                    nokCount: this.nokCount,
                    defectCount: this.defectCount
                }
            }));
        },
        
        // Ajouter une épaisseur valide
        addThickness(row, col, value) {
            // NE PAS retirer l'épaisseur NOK si elle existe - elle reste en badge rouge
            // La valeur OK va juste "rattraper" la NOK
            
            // Vérifier si une épaisseur existe déjà pour cette cellule
            const existingIndex = this.thicknesses.findIndex(e => e.row === row && e.col === col);
            if (existingIndex > -1) {
                // Mettre à jour la valeur existante
                this.thicknesses[existingIndex].value = value;
                this.thicknesses[existingIndex].isNok = false; // Marquer comme OK
            } else {
                // Ajouter l'épaisseur valide
                this.thicknesses.push({
                    row: row,
                    col: col,
                    value: value
                });
                this.thicknessCount = this.thicknesses.length;
            }
            
            this.updateEpaisseurDisplay();
        },
        
        // Supprimer une épaisseur NOK
        removeThicknessNok(row, col) {
            // On ne peut supprimer le badge NOK que si l'input est vide
            const hasValueInInput = this.thicknesses.some(e => e.row === row && e.col === col);
            if (hasValueInInput) {
                // L'input contient une valeur (OK ou NOK), on ne peut pas supprimer le badge
                return;
            }
            
            const index = this.nokThicknesses.findIndex(e => e.row === row && e.col === col);
            if (index > -1) {
                this.nokThicknesses.splice(index, 1);
                this.nokCount = this.nokThicknesses.length;
                this.updateEpaisseurDisplay();
            }
        },
        
        // Supprimer toute épaisseur (OK ou NOK) d'une cellule
        removeThickness(row, col) {
            // Supprimer l'épaisseur OK/NOK de l'input si elle existe
            const okIndex = this.thicknesses.findIndex(e => e.row === row && e.col === col);
            if (okIndex > -1) {
                this.thicknesses.splice(okIndex, 1);
                this.thicknessCount = this.thicknesses.length;
            }
            
            // Si on vide l'input ET qu'il n'y a pas de NOK en badge, tout supprimer
            // Si on vide l'input ET qu'il y a une NOK en badge, garder la NOK
            const hasNokBadge = this.nokThicknesses.some(e => e.row === row && e.col === col);
            if (!hasNokBadge) {
                // Pas de badge NOK, on peut tout supprimer
                const nokIndex = this.nokThicknesses.findIndex(e => e.row === row && e.col === col);
                if (nokIndex > -1) {
                    this.nokThicknesses.splice(nokIndex, 1);
                    this.nokCount = this.nokThicknesses.length;
                }
            }
            
            this.updateEpaisseurDisplay();
        },
        
        // Vérifier si une cellule a une épaisseur valide
        hasThicknessOk(row, col) {
            const ep = this.thicknesses.find(e => e.row === row && e.col === col);
            return ep && !ep.isNok;  // Vérifier que ce n'est pas une NOK
        },
        
        // Vérifier si une cellule a une épaisseur NOK affichée dans l'input
        hasThicknessNokInInput(row, col) {
            const ep = this.thicknesses.find(e => e.row === row && e.col === col);
            return ep && ep.isNok;
        },
        
        // Obtenir la valeur de l'épaisseur OK
        getThicknessOk(row, col) {
            const ep = this.thicknesses.find(e => e.row === row && e.col === col);
            if (ep) {
                // Convertir en string avec virgule
                return ep.value.toString().replace('.', ',');
            }
            return '';
        },
        
        // Naviguer vers la prochaine cellule d'épaisseur
        navigateToNextEpaisseur(currentInput, reverse = false) {
            const currentRow = parseInt(currentInput.dataset.row);
            const currentCol = currentInput.dataset.col;
            
            // Ordre des colonnes
            const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
            const currentColIndex = cols.indexOf(currentCol);
            
            // Trouver toutes les lignes avec épaisseur
            const epaisseurRows = [];
            for (let row = 1; row <= this.rowCount; row++) {
                if (this.isThicknessRow(row)) {
                    epaisseurRows.push(row);
                }
            }
            
            // Position actuelle dans la grille
            const currentRowIndex = epaisseurRows.indexOf(currentRow);
            
            let nextRow, nextCol;
            
            if (reverse) {
                // Navigation arrière (Shift+Tab)
                if (currentColIndex > 0) {
                    // Colonne précédente, même ligne
                    nextRow = currentRow;
                    nextCol = cols[currentColIndex - 1];
                } else if (currentRowIndex > 0) {
                    // Dernière colonne de la ligne précédente
                    nextRow = epaisseurRows[currentRowIndex - 1];
                    nextCol = cols[cols.length - 1];
                } else {
                    // On est au début, aller à la fin
                    nextRow = epaisseurRows[epaisseurRows.length - 1];
                    nextCol = cols[cols.length - 1];
                }
            } else {
                // Navigation avant (Tab)
                if (currentColIndex < cols.length - 1) {
                    // Colonne suivante, même ligne
                    nextRow = currentRow;
                    nextCol = cols[currentColIndex + 1];
                } else if (currentRowIndex < epaisseurRows.length - 1) {
                    // Première colonne de la ligne suivante
                    nextRow = epaisseurRows[currentRowIndex + 1];
                    nextCol = cols[0];
                } else {
                    // On est à la fin, aller au début
                    nextRow = epaisseurRows[0];
                    nextCol = cols[0];
                }
            }
            
            // Trouver et focus le prochain input
            const nextInput = this.$el.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    };
}