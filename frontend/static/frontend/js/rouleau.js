// Composant Alpine.js pour le rouleau
function rouleau() {
    return {
        // État
        longueurCible: 0,
        nbEpaisseurs: 0,
        nbNok: 0,
        nbDefauts: 0,
        epaisseurs: [],
        epaisseursNok: [], // Épaisseurs rejetées
        defauts: [],
        defautTypes: [], // Types de défauts depuis Django
        selectedDefautType: null,
        showDefautSelector: false,
        currentCell: null,
        selectorPosition: { top: 0, left: 0 },
        
        // Initialisation
        init() {
            // Charger la longueur cible depuis la session
            this.loadLongueurCible();
            
            // Charger les types de défauts
            this.loadDefautTypes();
            
            // Écouter les changements
            window.addEventListener('longueur-cible-changed', (e) => {
                this.longueurCible = e.detail.longueur;
                this.updateGrid();
            });
            
            // Écouter la validation des épaisseurs (blur ou Enter)
            this.$el.addEventListener('blur', (e) => {
                if (e.target.classList.contains('epaisseur-input') && !e.target.dataset.processing) {
                    this.handleEpaisseurInput(e.target);
                }
            }, true);
            
            this.$el.addEventListener('keydown', (e) => {
                if (e.target.classList.contains('epaisseur-input')) {
                    if (e.key === 'Enter') {
                        this.handleEpaisseurInput(e.target);
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
            return ['G1', 'C1', 'D1', 'metrage', 'G2', 'C2', 'D2'];
        },
        
        // Charger la longueur cible
        loadLongueurCible() {
            if (window.sessionData?.longueur_cible) {
                this.longueurCible = parseInt(window.sessionData.longueur_cible);
                this.updateGrid();
            }
        },
        
        // Mettre à jour la grille
        updateGrid() {
            // Logique pour générer la grille en fonction de la longueur
            // À implémenter selon les spécifications
            console.log('Mise à jour de la grille pour longueur:', this.longueurCible);
        },
        
        
        // Ajouter un défaut
        addDefaut(position, type) {
            this.defauts.push({ position, type });
            this.nbDefauts = this.defauts.length;
        },
        
        // Calculer la conformité
        get isConforme() {
            // Non conforme si on a des défauts
            if (this.nbDefauts > 0) {
                return false;
            }
            
            // Vérifier si une cellule a 2 épaisseurs NOK (non rattrapée)
            // Parcourir toutes les lignes et colonnes
            for (let row = 1; row <= 12; row++) {
                if (this.isEpaisseurRow(row)) {
                    const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
                    for (const col of cols) {
                        // Si on a un badge NOK ET un input NOK dans la même cellule = non conforme
                        if (this.hasEpaisseurNok(row, col) && this.hasEpaisseurNokInInput(row, col)) {
                            return false;
                        }
                    }
                }
            }
            
            // Conforme si pas de défauts et pas de cellule avec 2 NOK
            return true;
        },
        
        // Vérifier si une ligne doit avoir des inputs d'épaisseur
        isEpaisseurRow(row) {
            // Épaisseurs tous les 5m à partir de 3m
            // Si longueur < 3m, on met à la ligne 1
            if (this.longueurCible < 3) {
                return row === 1;
            }
            // Sinon : ligne 3 (3m), ligne 8 (8m), etc.
            return row === 3 || row === 8;
        },
        
        // Charger les types de défauts depuis l'API
        async loadDefautTypes() {
            try {
                const response = await fetch('/api/defect-types/');
                if (response.ok) {
                    this.defautTypes = await response.json();
                } else {
                    throw new Error('API non disponible');
                }
            } catch (error) {
                console.error('Erreur chargement types de défauts:', error);
                // Types de défauts de test
                this.defautTypes = [
                    { id: 1, name: "Trou" },
                    { id: 2, name: "Déchirure" },
                    { id: 3, name: "Tache" },
                    { id: 4, name: "Pli" },
                    { id: 5, name: "Corps étranger" },
                    { id: 6, name: "Surépaisseur" },
                    { id: 7, name: "Manque matière" }
                ];
            }
        },
        
        // Ouvrir le sélecteur de défauts
        openDefautSelector(event, row, col) {
            console.log('openDefautSelector called:', row, col, event);
            
            // Si on clique sur l'input d'épaisseur, ne rien faire
            if (event.target.classList.contains('epaisseur-input')) {
                return;
            }
            
            // Stopper la propagation pour éviter les conflits
            event.stopPropagation();
            
            this.currentCell = { row, col };
            
            // Si la cellule a déjà un défaut, on pré-sélectionne le défaut existant
            const existingDefaut = this.defauts.find(d => d.row === row && d.col === col);
            this.selectedDefautType = existingDefaut ? existingDefaut.typeId : '';
            
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
            
            this.showDefautSelector = true;
            
            // Focus sur le select après le rendu
            this.$nextTick(() => {
                const selector = document.querySelector('.defaut-selector');
                if (selector) {
                    selector.focus();
                }
            });
        },
        
        // Ajouter un défaut
        addDefaut() {
            if (!this.selectedDefautType || !this.currentCell) return;
            
            const defaut = {
                row: this.currentCell.row,
                col: this.currentCell.col,
                typeId: this.selectedDefautType,
                typeName: this.defautTypes.find(d => d.id == this.selectedDefautType)?.name
            };
            
            this.defauts.push(defaut);
            this.nbDefauts = this.defauts.length;
            this.showDefautSelector = false;
            
            // Mettre à jour l'affichage
            this.updateCellDisplay(this.currentCell.row, this.currentCell.col);
            
            // Émettre un événement pour mettre à jour le badge
            window.dispatchEvent(new CustomEvent('rouleau-updated', {
                detail: { 
                    nbEpaisseurs: this.nbEpaisseurs,
                    nbNok: this.nbNok,
                    nbDefauts: this.nbDefauts
                }
            }));
        },
        
        // Mettre à jour l'affichage d'une cellule
        updateCellDisplay(row, col) {
            // L'affichage est géré automatiquement par Alpine.js via les bindings
            console.log('Défaut ajouté:', row, col);
        },
        
        // Vérifier si une cellule a un défaut
        hasDefaut(row, col) {
            return this.defauts.some(d => d.row === row && d.col === col);
        },
        
        // Obtenir le code du défaut pour affichage
        getDefautCode(row, col) {
            const defaut = this.defauts.find(d => d.row === row && d.col === col);
            if (defaut && defaut.typeName) {
                // Prendre les 3 premières lettres du nom
                return defaut.typeName.substring(0, 3).toUpperCase();
            }
            return '';
        },
        
        // Supprimer un défaut
        removeDefaut(row, col) {
            // Pour l'instant, supprimer directement sans animation
            const index = this.defauts.findIndex(d => d.row === row && d.col === col);
            if (index > -1) {
                this.defauts.splice(index, 1);
                this.nbDefauts = this.defauts.length;
                
                // Émettre un événement pour mettre à jour le badge
                window.dispatchEvent(new CustomEvent('rouleau-updated', {
                    detail: { 
                        nbEpaisseurs: this.nbEpaisseurs,
                        nbNok: this.nbNok,
                        nbDefauts: this.nbDefauts
                    }
                }));
            }
        },
        
        // Vérifier si une ligne a au moins un défaut
        hasDefautInRow(row) {
            // Une ligne a un défaut si elle a un défaut visuel OU une cellule avec 2 épaisseurs NOK
            if (this.defauts.some(d => d.row === row)) {
                return true;
            }
            
            // Vérifier si une cellule de cette ligne a 2 épaisseurs NOK
            const cols = ['G1', 'C1', 'D1', 'G2', 'C2', 'D2'];
            for (const col of cols) {
                // Si on a un badge NOK ET un input NOK dans la même cellule
                if (this.hasEpaisseurNok(row, col) && this.hasEpaisseurNokInInput(row, col)) {
                    return true;
                }
            }
            
            return false;
        },
        
        // Gérer la saisie d'épaisseur
        handleEpaisseurInput(input) {
            // Remplacer la virgule par un point pour parseFloat
            const inputValue = input.value.trim().replace(',', '.');
            const value = parseFloat(inputValue);
            const row = parseInt(input.dataset.row);
            const col = input.dataset.col;
            
            // Si l'input est vide, supprimer toute épaisseur (OK ou NOK)
            if (inputValue === '') {
                this.removeEpaisseur(row, col);
                return;
            }
            
            if (!isNaN(value)) {
                // Vérifier si l'épaisseur est NOK (< 5 pour le test)
                if (value < 5) {
                    // Vérifier si c'est la première NOK de la cellule
                    const hasNokInCell = this.epaisseursNok.some(e => e.row === row && e.col === col);
                    
                    // D'abord supprimer toute ancienne valeur
                    this.removeEpaisseur(row, col);
                    
                    if (!hasNokInCell) {
                        // Première NOK : badge rouge normal
                        this.epaisseursNok.push({
                            row: row,
                            col: col,
                            value: value
                        });
                        this.nbNok = this.epaisseursNok.length;
                        
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
                        this.epaisseurs.push({
                            row: row,
                            col: col,
                            value: value,
                            isNok: true  // Marquer comme NOK pour le style
                        });
                        this.nbEpaisseurs = this.epaisseurs.length;
                        // Pas d'incrémentation de nbNok ici car c'est la 2e NOK de la même cellule
                        
                        // Garder la valeur dans l'input
                        input.value = inputValue; // Garder la valeur originale avec virgule
                    }
                    
                    // Mettre à jour l'affichage
                    this.updateEpaisseurDisplay();
                } else {
                    // Épaisseur OK
                    this.addEpaisseur(row, col, value);
                }
            }
        },
        
        // Vérifier si une cellule a une épaisseur NOK
        hasEpaisseurNok(row, col) {
            return this.epaisseursNok.some(e => e.row === row && e.col === col);
        },
        
        // Obtenir la valeur de l'épaisseur NOK
        getEpaisseurNok(row, col) {
            const ep = this.epaisseursNok.find(e => e.row === row && e.col === col);
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
            // Émettre un événement pour mettre à jour le badge
            window.dispatchEvent(new CustomEvent('rouleau-updated', {
                detail: { 
                    nbEpaisseurs: this.nbEpaisseurs,
                    nbNok: this.nbNok,
                    nbDefauts: this.nbDefauts
                }
            }));
        },
        
        // Ajouter une épaisseur valide
        addEpaisseur(row, col, value) {
            // NE PAS retirer l'épaisseur NOK si elle existe - elle reste en badge rouge
            // La valeur OK va juste "rattraper" la NOK
            
            // Vérifier si une épaisseur existe déjà pour cette cellule
            const existingIndex = this.epaisseurs.findIndex(e => e.row === row && e.col === col);
            if (existingIndex > -1) {
                // Mettre à jour la valeur existante
                this.epaisseurs[existingIndex].value = value;
                this.epaisseurs[existingIndex].isNok = false; // Marquer comme OK
            } else {
                // Ajouter l'épaisseur valide
                this.epaisseurs.push({
                    row: row,
                    col: col,
                    value: value
                });
                this.nbEpaisseurs = this.epaisseurs.length;
            }
            
            this.updateEpaisseurDisplay();
        },
        
        // Supprimer une épaisseur NOK
        removeEpaisseurNok(row, col) {
            // On ne peut supprimer le badge NOK que si l'input est vide
            const hasValueInInput = this.epaisseurs.some(e => e.row === row && e.col === col);
            if (hasValueInInput) {
                // L'input contient une valeur (OK ou NOK), on ne peut pas supprimer le badge
                return;
            }
            
            const index = this.epaisseursNok.findIndex(e => e.row === row && e.col === col);
            if (index > -1) {
                this.epaisseursNok.splice(index, 1);
                this.nbNok = this.epaisseursNok.length;
                this.updateEpaisseurDisplay();
            }
        },
        
        // Supprimer toute épaisseur (OK ou NOK) d'une cellule
        removeEpaisseur(row, col) {
            // Supprimer l'épaisseur OK/NOK de l'input si elle existe
            const okIndex = this.epaisseurs.findIndex(e => e.row === row && e.col === col);
            if (okIndex > -1) {
                this.epaisseurs.splice(okIndex, 1);
                this.nbEpaisseurs = this.epaisseurs.length;
            }
            
            // Si on vide l'input ET qu'il n'y a pas de NOK en badge, tout supprimer
            // Si on vide l'input ET qu'il y a une NOK en badge, garder la NOK
            const hasNokBadge = this.epaisseursNok.some(e => e.row === row && e.col === col);
            if (!hasNokBadge) {
                // Pas de badge NOK, on peut tout supprimer
                const nokIndex = this.epaisseursNok.findIndex(e => e.row === row && e.col === col);
                if (nokIndex > -1) {
                    this.epaisseursNok.splice(nokIndex, 1);
                    this.nbNok = this.epaisseursNok.length;
                }
            }
            
            this.updateEpaisseurDisplay();
        },
        
        // Vérifier si une cellule a une épaisseur valide
        hasEpaisseurOk(row, col) {
            const ep = this.epaisseurs.find(e => e.row === row && e.col === col);
            return ep && !ep.isNok;  // Vérifier que ce n'est pas une NOK
        },
        
        // Vérifier si une cellule a une épaisseur NOK affichée dans l'input
        hasEpaisseurNokInInput(row, col) {
            const ep = this.epaisseurs.find(e => e.row === row && e.col === col);
            return ep && ep.isNok;
        },
        
        // Obtenir la valeur de l'épaisseur OK
        getEpaisseurOk(row, col) {
            const ep = this.epaisseurs.find(e => e.row === row && e.col === col);
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
            for (let row = 1; row <= 12; row++) {
                if (this.isEpaisseurRow(row)) {
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