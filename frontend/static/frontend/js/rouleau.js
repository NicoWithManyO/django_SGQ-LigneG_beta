// Composant Alpine.js pour le rouleau
function rouleau() {
    return {
        // État
        longueurCible: 0,
        nbEpaisseurs: 0,
        nbNok: 0,
        nbDefauts: 0,
        epaisseurs: [],
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
        
        // Ajouter une épaisseur
        addEpaisseur(position, value) {
            this.epaisseurs.push({ position, value });
            this.nbEpaisseurs = this.epaisseurs.length;
            if (value < 0) { // Exemple de condition NOK
                this.nbNok++;
            }
        },
        
        // Ajouter un défaut
        addDefaut(position, type) {
            this.defauts.push({ position, type });
            this.nbDefauts = this.defauts.length;
        },
        
        // Calculer la conformité
        get isConforme() {
            return this.nbNok === 0 && this.nbDefauts === 0;
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
            // Trouver l'index du défaut à supprimer
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
            return this.defauts.some(d => d.row === row);
        }
    };
}