// Composant Alpine.js pour le rouleau
function roll() {
    return {
        // État
        targetLength: 0,
        rowCount: 0, // Nombre de lignes à afficher (basé sur longueur cible)
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
        currentProfile: null,
        thicknessSpec: null,
        qcStatus: 'pending', // Statut du contrôle qualité
        
        // Initialisation
        init() {
            // Charger la longueur cible depuis la session (qui va aussi charger les données)
            this.loadTargetLength();
            
            // Charger les types de défauts
            this.loadDefectTypes();
            
            // Écouter les changements
            window.addEventListener('target-length-changed', (e) => {
                this.targetLength = e.detail.length;
                this.updateGrid();
            });
            
            // Écouter les changements de profil
            window.addEventListener('profile-changed', (e) => {
                this.currentProfile = e.detail.profile;
                this.thicknessSpec = this.currentProfile?.profilespecvalue_set?.find(spec => 
                    spec.spec_item.name === 'thickness' || 
                    spec.spec_item.display_name.toLowerCase().includes('épaisseur')
                );
            });
            
            // Écouter les changements du contrôle qualité
            window.addEventListener('quality-control-updated', (e) => {
                this.qcStatus = e.detail.status;
                // La conformité sera recalculée automatiquement via les watchers Alpine
            });
            
            // Émettre l'état initial après un court délai pour que tout soit initialisé
            setTimeout(() => {
                this.updateEpaisseurDisplay();
            }, 100);
            
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
                    
                    // Appliquer l'orange seulement si pas de badge NOK
                    const hasNokBadge = this.nokThicknesses.some(e => e.row === thickness.row && e.col === thickness.col);
                    if (!hasNokBadge && this.checkThicknessStatus(thickness.value) === 'alert') {
                        input.classList.add('text-warning');
                    } else if (thickness.isNok) {
                        input.classList.add('text-danger');
                    } else {
                        input.classList.remove('text-warning', 'text-danger');
                    }
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
            
            // Recharger les données du rouleau pour réafficher les épaisseurs/défauts existants
            // Important quand on agrandit le rouleau (ex: 12m → 32m)
            this.loadRollData();
            
            // Émettre un événement pour notifier du changement
            this.$dispatch('grid-updated', { rows: this.rowCount });
        },
        
        
        // Ajouter un défaut
        addDefect(position, type) {
            this.defects.push({ position, type });
            this.defectCount = this.defects.length;
        },
        
        // Calculer la conformité du rouleau complet
        get isConform() {
            return rollConformity.calculate({
                defects: this.defects,
                defectTypes: this.defectTypes,
                thicknesses: this.thicknesses,
                nokThicknesses: this.nokThicknesses,
                targetLength: this.targetLength,
                qcStatus: this.qcStatus
            });
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
            
            // Position du sélecteur juste au-dessus du bouton
            // Le select aura sa hauteur automatique selon le nombre d'options
            this.selectorPosition = {
                bottom: window.innerHeight - buttonRect.top + 5, // 5px au-dessus du bouton
                left: buttonRect.left - 50 // Centrer le sélecteur
            };
            
            
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
            
            const selectedDefect = this.defectTypes.find(d => d.id == this.selectedDefectType);
            const defect = {
                row: this.currentCell.row,
                col: this.currentCell.col,
                typeId: this.selectedDefectType,
                typeName: selectedDefect?.name,
                severity: selectedDefect?.severity
            };
            
            this.defects.push(defect);
            this.defectCount = this.defects.length;
            this.showDefectSelector = false;
            
            // Mettre à jour l'affichage
            this.updateCellDisplay(this.currentCell.row, this.currentCell.col);
            
            // Sauvegarder dans la session
            this.saveRollData();
            
            // Compter les cellules avec au moins un NOK
            const cellsWithNokCount = rollBusinessLogic.countCellsWithNok(this.thicknesses, this.nokThicknesses);
            
            // Émettre un événement pour mettre à jour le badge
            window.dispatchEvent(new CustomEvent('rouleau-updated', {
                detail: { 
                    thicknessCount: this.thicknessCount,
                    nokCount: this.nokCount,
                    defectCount: this.defectCount,
                    cellsWithNokCount: cellsWithNokCount,
                    defects: this.defects,
                    isConform: this.isConform
                }
            }));
        },
        
        // Mettre à jour l'affichage d'une cellule
        updateCellDisplay(row, col) {
            // L'affichage est géré automatiquement par Alpine.js via les bindings
        },
        
        // Vérifier si une cellule a un défaut
        hasDefect(row, col) {
            return this.defects.some(d => d.row === row && d.col === col);
        },
        
        // Obtenir le code du défaut pour affichage
        getDefectCode(row, col) {
            const defect = this.defects.find(d => d.row === row && d.col === col);
            if (defect && defect.typeName) {
                // Utiliser le module de formatage
                return rollFormatters.formatDefectCode(defect.typeName);
            }
            return '';
        },
        
        // Obtenir la classe CSS selon la sévérité du défaut
        getDefectSeverityClass(row, col) {
            const defect = this.defects.find(d => d.row === row && d.col === col);
            if (!defect) return '';
            return (defect.severity === 'non_blocking' || defect.severity === 'threshold') ? 'non-blocking' : '';
        },
        
        // Compter le nombre de défauts d'un type donné
        getDefectCount(typeId) {
            return this.defects.filter(d => d.typeId == typeId).length;
        },
        
        // Obtenir le typeId du défaut à une position donnée
        getDefectTypeId(row, col) {
            const defect = this.defects.find(d => d.row === row && d.col === col);
            return defect ? defect.typeId : null;
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
                
                // Compter les cellules avec au moins un NOK
                const cellsWithNokCount = rollBusinessLogic.countCellsWithNok(this.thicknesses, this.nokThicknesses);
                
                // Émettre un événement pour mettre à jour le badge
                window.dispatchEvent(new CustomEvent('rouleau-updated', {
                    detail: { 
                        thicknessCount: this.thicknessCount,
                        nokCount: this.nokCount,
                        defectCount: this.defectCount,
                        cellsWithNokCount: cellsWithNokCount,
                        defects: this.defects
                    }
                }));
            }
        },
        
        // Trouver la dernière ligne avec un problème
        getLastProblemRow() {
            return rollConformity.getLastProblemRow({
                defects: this.defects,
                thicknesses: this.thicknesses,
                nokThicknesses: this.nokThicknesses,
                targetLength: this.targetLength
            });
        },
        
        // Vérifier si une ligne doit afficher les ciseaux
        hasDefectInRow(row) {
            // Les ciseaux ne s'affichent que sur la dernière ligne problématique
            if (!this.isConform) {
                return row === this.getLastProblemRow();
            }
            return false;
        },
        
        // Obtenir les positions des épaisseurs pour le calcul du total
        getThicknessPositions() {
            return rollHelpers.getThicknessPositions(this.targetLength);
        },
        
        // Obtenir le seuil du défaut épaisseur
        getThicknessThreshold() {
            const thicknessDefect = rollHelpers.getThicknessDefect(this.defectTypes);
            return thicknessDefect?.threshold_value || null;
        },
        
        // Obtenir la liste des défauts
        getDefectsList() {
            return rollFormatters.formatDefectsList(this.defects);
        },
        
        // Vérifier si la première ligne d'épaisseur est complète (6 épaisseurs)
        hasFirstRowComplete() {
            // Trouver la première ligne avec épaisseur
            const firstThicknessRow = this.isThicknessRow(1) ? 1 : 3;
            
            // Compter les épaisseurs sur cette ligne
            const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
            let count = 0;
            
            for (const col of cols) {
                if (this.thicknesses.some(t => t.row === firstThicknessRow && t.col === col)) {
                    count++;
                }
            }
            
            return count === 6;
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
                // Vérifier si l'épaisseur est NOK selon le profil
                const thicknessStatus = this.checkThicknessStatus(value);
                
                if (thicknessStatus === 'nok') {
                    // Vérifier si c'est la première NOK de la cellule
                    const hasNokInCell = this.nokThicknesses.some(e => e.row === row && e.col === col);
                    
                    if (!hasNokInCell) {
                        // D'abord supprimer toute ancienne valeur seulement si c'est la première NOK
                        this.removeThickness(row, col);
                        // Première NOK : badge rouge normal
                        this.nokThicknesses.push({
                            row: row,
                            col: col,
                            value: value.toString().replace(',', '.')
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
                    // Épaisseur OK ou en alerte
                    this.addThickness(row, col, value);
                    input.classList.remove('text-danger');
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
            
            // Compter les cellules avec au moins un NOK
            const cellsWithNokCount = rollBusinessLogic.countCellsWithNok(this.thicknesses, this.nokThicknesses);
            
            // Émettre un événement pour mettre à jour le badge
            window.dispatchEvent(new CustomEvent('rouleau-updated', {
                detail: { 
                    thicknessCount: this.thicknessCount,
                    nokCount: this.nokCount,
                    defectCount: this.defectCount,
                    cellsWithNokCount: cellsWithNokCount,
                    defects: this.defects,
                    isConform: this.isConform
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
                this.thicknesses[existingIndex].isNok = false;
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
            
            // Appliquer la couleur orange si alerte et pas de badge NOK
            const input = this.$el.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            if (input) {
                const hasNokBadge = this.nokThicknesses.some(e => e.row === row && e.col === col);
                const status = this.checkThicknessStatus(value);
                
                console.log(`Thickness ${value}: status=${status}, hasNokBadge=${hasNokBadge}, spec=`, this.thicknessSpec);
                
                if (!hasNokBadge && status === 'alert') {
                    input.classList.add('text-warning');
                } else {
                    input.classList.remove('text-warning');
                }
            }
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
        
        // Vérifier le statut d'une épaisseur par rapport au profil
        checkThicknessStatus(value) {
            if (!this.currentProfile || !this.thicknessSpec) {
                return value < 5 ? 'nok' : 'ok';
            }
            
            const spec = this.thicknessSpec;
            const val = parseFloat(value);
            
            // D'abord vérifier les limites critiques
            if (spec.value_min !== null && val < parseFloat(spec.value_min)) {
                return 'nok';
            }
            if (spec.value_max !== null && val > parseFloat(spec.value_max)) {
                return 'nok';
            }
            
            // Ensuite vérifier les alertes
            if (spec.value_min_alert !== null && val < parseFloat(spec.value_min_alert)) {
                return 'alert';
            }
            if (spec.value_max_alert !== null && val > parseFloat(spec.value_max_alert)) {
                return 'alert';
            }
            
            return 'ok';
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