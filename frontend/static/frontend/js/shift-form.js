// Composant Alpine.js pour la fiche de poste
function shiftForm() {
    return {
        // Inclure les mixins partagés
        ...sharedMixins.sessionSaver,
        // État
        operatorId: '',
        shiftDate: '',
        vacation: '',
        startTime: '',
        endTime: '',
        machineStartedStart: null,
        machineStartedEnd: null,
        lengthStart: '',
        lengthEnd: '',
        comment: '',
        shiftId: null,
        isValid: false,
        hasValidId: false, // Pour l'icône ID Poste uniquement
        idStatus: 'empty', // 'empty', 'valid', 'duplicate'
        qcStatus: 'pending', // Statut du contrôle qualité
        checklistSigned: false, // Statut de signature de la checklist
        hasStartupTime: false, // Indique si du temps de démarrage a été déclaré
        
        // Handlers pour éviter les doubles listeners
        shiftSaveHandlers: null,
        isSavingShift: false,
        isInitializing: true, // Flag pour éviter la sauvegarde pendant le chargement
        
        // Initialisation
        init() {
            // Charger les données de session
            this.loadFromSession();
            
            // Générer l'ID au chargement après que le DOM soit mis à jour
            this.$nextTick(() => {
                this.generateShiftId();
                // Marquer la fin de l'initialisation après un court délai
                setTimeout(() => {
                    // Si les valeurs sont toujours null, les mettre à false
                    if (this.machineStartedStart === null) this.machineStartedStart = false;
                    if (this.machineStartedEnd === null) this.machineStartedEnd = false;
                    this.isInitializing = false;
                }, 100);
            });
            
            // Watchers individuels pour les champs qui affectent shiftId
            this.$watch('operatorId', () => {
                this.generateShiftId();
                // Émettre un événement pour notifier le changement d'opérateur
                window.dispatchEvent(new Event('operator-changed'));
            });
            
            this.$watch('shiftDate', () => {
                this.generateShiftId();
            });
            
            this.$watch('vacation', () => {
                this.generateShiftId();
                if (this.vacation) {
                    this.setDefaultHours();
                }
            });
            
            // Watchers spécifiques pour la logique métier
            this.$watch('machineStartedStart', () => {
                if (!this.machineStartedStart) {
                    this.lengthStart = '';
                }
                this.validateForm();
            });
            
            this.$watch('machineStartedEnd', () => {
                if (!this.machineStartedEnd) {
                    this.lengthEnd = '';
                }
                this.validateForm();
            });
            
            // Watchers pour la validation
            this.$watch('startTime', () => this.validateForm());
            this.$watch('endTime', () => this.validateForm());
            this.$watch('lengthStart', () => this.validateForm());
            this.$watch('lengthEnd', () => this.validateForm());
            
            // Sauvegarder avec un mapping des noms de propriétés
            let saveTimeout = null;
            const saveToSessionWithMapping = () => {
                // Ne pas sauvegarder pendant l'initialisation
                if (this.isInitializing) {
                    console.log('Skipping save during initialization');
                    return;
                }
                
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    const dataToSave = {
                        operator_id: this.operatorId,
                        shift_date: this.shiftDate,
                        vacation: this.vacation,
                        start_time: this.startTime,
                        end_time: this.endTime,
                        machine_started_start: this.machineStartedStart,
                        machine_started_end: this.machineStartedEnd,
                        length_start: this.lengthStart,
                        length_end: this.lengthEnd,
                        comment: this.comment
                    };
                    console.log('Saving to session:', {
                        machine_started_start: dataToSave.machine_started_start,
                        machine_started_end: dataToSave.machine_started_end
                    });
                    this.saveToSession(dataToSave);
                }, 300);
            };
            
            // Watchers pour sauvegarder avec le bon mapping
            ['operatorId', 'shiftDate', 'vacation', 'startTime', 'endTime',
             'machineStartedStart', 'machineStartedEnd', 'lengthStart', 'lengthEnd', 'comment'
            ].forEach(field => {
                this.$watch(field, saveToSessionWithMapping);
            });
            
            // Écouter les changements du contrôle qualité
            window.addEventListener('quality-control-updated', (e) => {
                this.qcStatus = e.detail.status;
                this.validateForm();
            });
            
            // Écouter les changements de la checklist
            window.addEventListener('checklist-status-changed', (e) => {
                this.checklistSigned = e.detail.signed || false;
                this.validateForm();
            });
            
            // Écouter les changements de temps perdu
            window.addEventListener('lost-time-updated', (e) => {
                this.hasStartupTime = e.detail.hasStartupTime || false;
                this.validateForm();
            });
        },
        
        // Charger depuis la session
        loadFromSession() {
            if (window.sessionData) {
                // S'assurer que les valeurs sont des chaînes pour éviter l'erreur trim()
                this.operatorId = String(window.sessionData.operator_id || '');
                this.shiftDate = String(window.sessionData.shift_date || '');
                this.vacation = String(window.sessionData.vacation || '');
                this.startTime = String(window.sessionData.start_time || '');
                this.endTime = String(window.sessionData.end_time || '');
                // Pour les booléens, ne pas utiliser || false car false || false = false
                console.log('Loading machine states from session:', {
                    start: window.sessionData.machine_started_start,
                    end: window.sessionData.machine_started_end
                });
                // Charger les valeurs booléennes seulement si elles existent
                if (window.sessionData.machine_started_start !== undefined) {
                    this.machineStartedStart = window.sessionData.machine_started_start;
                }
                if (window.sessionData.machine_started_end !== undefined) {
                    this.machineStartedEnd = window.sessionData.machine_started_end;
                }
                this.lengthStart = String(window.sessionData.length_start || '');
                this.lengthEnd = String(window.sessionData.length_end || '');
                this.comment = String(window.sessionData.comment || '');
                
                // Charger le statut QC depuis la session
                if (window.sessionData.qc_status) {
                    this.qcStatus = window.sessionData.qc_status;
                }
                
                // Charger le statut de la checklist depuis la session
                if (window.sessionData.checklist_signature_time) {
                    this.checklistSigned = true;
                }
                
                // Charger le statut du temps de démarrage depuis la session
                if (window.sessionData.has_startup_time) {
                    this.hasStartupTime = true;
                }
                
                // Vérifier aussi directement dans les lost_time_entries au cas où
                if (window.sessionData.lost_time_entries && window.sessionData.lost_time_entries.length > 0) {
                    // Déclencher manuellement l'événement pour recalculer hasStartupTime
                    window.dispatchEvent(new CustomEvent('lost-time-updated', {
                        detail: { 
                            hasStartupTime: window.sessionData.has_startup_time || false
                        }
                    }));
                }
            }
        },
        
        // Override pour mapper les noms de champs
        async saveToSession(data) {
            // Si pas de data fournie, utiliser tous les champs
            if (!data) {
                data = {
                    operatorId: this.operatorId,
                    shiftDate: this.shiftDate,
                    vacation: this.vacation,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    machineStartedStart: this.machineStartedStart,
                    machineStartedEnd: this.machineStartedEnd,
                    lengthStart: this.lengthStart,
                    lengthEnd: this.lengthEnd,
                    comment: this.comment
                };
            }
            
            // Mapper camelCase vers snake_case pour l'API
            const mappedData = {};
            const fieldMapping = {
                operatorId: 'operator_id',
                shiftDate: 'shift_date',
                startTime: 'start_time',
                endTime: 'end_time',
                machineStartedStart: 'machine_started_start',
                machineStartedEnd: 'machine_started_end',
                lengthStart: 'length_start',
                lengthEnd: 'length_end'
            };
            
            // Ne pas sauvegarder shift_id en session car ce n'est pas un champ valide
            // L'ID est généré côté frontend uniquement
            
            Object.keys(data).forEach(key => {
                const mappedKey = fieldMapping[key] || key;
                mappedData[mappedKey] = data[key] || null;
            });
            
            await api.saveToSession(mappedData);
        },
        
        // Générer l'ID du poste
        async generateShiftId() {
            if (this.operatorId && this.shiftDate && this.vacation) {
                // Format: JJMMAA_PrenomNom_Vacation
                const date = new Date(this.shiftDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                
                // Récupérer le nom de l'opérateur depuis le select
                const operatorSelect = document.getElementById('operator-select');
                const operatorName = operatorSelect?.options[operatorSelect.selectedIndex]?.text || '';
                
                if (operatorName && operatorName !== '--') {
                    const nameParts = operatorName.trim().split(' ');
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join('') || '';
                    this.shiftId = `${day}${month}${year}_${firstName}${lastName}_${this.vacation}`;
                    this.hasValidId = true;
                    
                    // Vérifier l'unicité de l'ID
                    try {
                        const response = await api.get('/api/shifts/check-id/', {
                            shift_id: this.shiftId
                        });
                        
                        if (response.exists) {
                            this.idStatus = 'duplicate';
                            this.hasValidId = false;
                        } else {
                            this.idStatus = 'valid';
                            this.hasValidId = true;
                            // Sauvegarder le shift_id en session
                            await api.saveToSession({ shift_id: this.shiftId });
                        }
                    } catch (error) {
                        console.error('Erreur vérification ID:', error);
                        // En cas d'erreur, on considère comme valide
                        this.idStatus = 'valid';
                    }
                } else {
                    this.shiftId = null;
                    this.hasValidId = false;
                    this.idStatus = 'empty';
                }
            } else {
                this.shiftId = null;
                this.hasValidId = false;
                this.idStatus = 'empty';
            }
            
            // Valider après génération de l'ID
            this.validateForm();
        },
        
        // Valider le formulaire complet
        validateForm() {
            // Vérifier les champs obligatoires de base
            if (!this.shiftId || !this.startTime || !this.endTime) {
                this.isValid = false;
                return;
            }
            
            // Vérifier que l'ID n'est pas dupliqué
            if (this.idStatus === 'duplicate') {
                this.isValid = false;
                return;
            }
            
            // Vérifier que le contrôle qualité est fait (pas pending)
            if (this.qcStatus === 'pending') {
                this.isValid = false;
                return;
            }
            
            // Vérifier que la checklist est signée
            if (!this.checklistSigned) {
                this.isValid = false;
                return;
            }
            
            // Si machine pas démarrée, vérifier qu'il y a du temps de démarrage
            if (!this.machineStartedStart && !this.hasStartupTime) {
                this.isValid = false;
                return;
            }
            
            // Vérifier la cohérence machine/métrage
            if (this.machineStartedStart && !this.lengthStart) {
                this.isValid = false;
                return;
            }
            
            if (this.machineStartedEnd && !this.lengthEnd) {
                this.isValid = false;
                return;
            }
            
            // Vérifier la cohérence des heures (sauf pour vacation Nuit)
            if (this.vacation !== 'Nuit') {
                const start = this.timeToMinutes(this.startTime);
                const end = this.timeToMinutes(this.endTime);
                
                if (start >= end) {
                    this.isValid = false;
                    return;
                }
            }
            
            // Toutes les validations sont passées
            this.isValid = true;
        },
        
        // Convertir heure HH:MM en minutes
        timeToMinutes(time) {
            if (!time) return 0;
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        },
        
        // Obtenir le message de validation pour le tooltip
        getValidationMessage() {
            const messages = [];
            
            // Vérifier les champs de base
            if (!this.operatorId) messages.push("Sélectionner un opérateur");
            if (!this.shiftDate) messages.push("Saisir la date");
            if (!this.vacation) messages.push("Sélectionner la vacation");
            if (!this.startTime) messages.push("Saisir l'heure de début");
            if (!this.endTime) messages.push("Saisir l'heure de fin");
            
            // Vérifier l'ID dupliqué
            if (this.idStatus === 'duplicate') messages.push("Cet ID de poste existe déjà");
            
            // Vérifier le contrôle qualité
            if (this.qcStatus === 'pending') messages.push("Compléter le contrôle qualité");
            
            // Vérifier la checklist
            if (!this.checklistSigned) messages.push("Signer la checklist de démarrage");
            
            // Vérifier le temps de démarrage si machine pas démarrée
            if (!this.machineStartedStart && !this.hasStartupTime) {
                messages.push("Déclarer le temps de démarrage machine");
            }
            
            // Vérifier la cohérence machine/métrage
            if (this.machineStartedStart && !this.lengthStart) {
                messages.push("Saisir le métrage de début (machine démarrée)");
            }
            if (this.machineStartedEnd && !this.lengthEnd) {
                messages.push("Saisir le métrage de fin (machine démarrée)");
            }
            
            // Vérifier la cohérence des heures
            if (this.startTime && this.endTime && this.vacation !== 'Nuit') {
                const start = this.timeToMinutes(this.startTime);
                const end = this.timeToMinutes(this.endTime);
                if (start >= end) messages.push("L'heure de fin doit être après l'heure de début");
            }
            
            return messages.length > 0 ? messages.join(" • ") : "";
        },
        
        // Définir les heures par défaut selon la vacation
        setDefaultHours() {
            switch(this.vacation) {
                case 'Matin':
                    this.startTime = '04:00';
                    this.endTime = '12:00';
                    break;
                case 'ApresMidi':
                    this.startTime = '12:00';
                    this.endTime = '20:00';
                    break;
                case 'Nuit':
                    this.startTime = '20:00';
                    this.endTime = '04:00';
                    break;
                case 'Journee':
                    this.startTime = '07:30';
                    this.endTime = '15:30';
                    break;
                default:
                    // Ne pas changer si vacation vide
                    break;
            }
        },
        
        // Sauvegarder le poste
        async saveShift() {
            if (!this.isValid || this.isSavingShift) return;
            
            this.isSavingShift = true;
            
            // Récupérer toutes les données du poste depuis la session
            const shiftData = {
                date: this.shiftDate,
                operator: this.operatorId,
                vacation: this.vacation,
                start_time: this.startTime,
                end_time: this.endTime,
                started_at_beginning: this.machineStartedStart,
                meter_reading_start: this.machineStartedStart ? parseFloat(this.lengthStart) || null : null,
                started_at_end: this.machineStartedEnd,
                meter_reading_end: this.machineStartedEnd ? parseFloat(this.lengthEnd) || null : null,
                operator_comments: this.comment || ''
            };
            
            // Récupérer les stats
            const stats = this.getShiftStatistics();
            
            // Préparer les données structurées pour la modal
            const modalData = {
                title: 'Confirmer la sauvegarde du poste',
                confirmText: 'Sauvegarder le poste',
                confirmEvent: 'confirm-shift-save',
                cancelEvent: 'cancel-shift-save',
                // Données structurées pour la modal
                shiftData: {
                    shiftId: this.shiftId,
                    date: new Date(this.shiftDate).toLocaleDateString('fr-FR'),
                    vacation: this.vacation,
                    qcCompleted: this.qcStatus === 'completed',
                    checklistSigned: this.checklistSigned,
                    rollCount: stats.rollCount,
                    lostTime: stats.lostTime
                }
            };
            
            // Nettoyer les anciens handlers s'ils existent
            if (this.shiftSaveHandlers) {
                window.removeEventListener('confirm-shift-save', this.shiftSaveHandlers.confirm);
                window.removeEventListener('cancel-shift-save', this.shiftSaveHandlers.cancel);
            }
            
            // Créer les nouveaux handlers
            this.shiftSaveHandlers = {
                confirm: async () => {
                    // Retirer immédiatement les listeners
                    window.removeEventListener('confirm-shift-save', this.shiftSaveHandlers.confirm);
                    window.removeEventListener('cancel-shift-save', this.shiftSaveHandlers.cancel);
                    this.shiftSaveHandlers = null;
                    
                    try {
                        console.log('Début sauvegarde poste avec données:', shiftData);
                        
                        // Sauvegarder le poste
                        const response = await api.post('/api/shifts/', shiftData);
                        
                        console.log('Réponse API:', response);
                        
                        if (response && response.id) {
                            console.log('Poste sauvegardé avec succès:', response);
                            
                            // Si le backend a renvoyé les données du prochain poste
                            if (response.next_shift_data) {
                                console.log('Données du prochain poste:', response.next_shift_data);
                                
                                // Sauvegarder les données du prochain poste en session
                                // Sauvegarder dans les clés directes pour compatibilité
                                const nextShiftData = {
                                    shift_date: response.next_shift_data.shift_date,
                                    vacation: response.next_shift_data.vacation,
                                    start_time: response.next_shift_data.start_time,
                                    end_time: response.next_shift_data.end_time,
                                    machine_started_start: response.next_shift_data.machine_started_start,
                                    machine_started_end: response.next_shift_data.machine_started_end,
                                    length_start: response.next_shift_data.length_start || '',
                                    operator_id: response.next_shift_data.operator_id || null,  // null au lieu de ''
                                    comment: response.next_shift_data.comment || ''
                                };
                                
                                // Sauvegarder en session via l'API
                                await api.saveToSession(nextShiftData);
                                console.log('Données du prochain poste sauvegardées en session');
                            }
                            
                            // Ne PAS fermer la modal - laisser l'utilisateur voir le succès
                            // La modal gère son propre état maintenant
                            
                            // Émettre un événement pour notifier les autres composants
                            window.dispatchEvent(new CustomEvent('shift-saved', {
                                detail: { shift: response }
                            }));
                            
                            // Recharger la page quand l'utilisateur ferme la modal
                            // Sera fait par la modal elle-même
                        } else {
                            console.error('Réponse API négative:', response);
                            throw new Error('Erreur lors de la sauvegarde');
                        }
                    } catch (error) {
                        console.error('Erreur sauvegarde poste:', error);
                        
                        // Fermer la modal
                        window.dispatchEvent(new CustomEvent('hide-save-modal'));
                        
                        // Déterminer le message d'erreur
                        let errorMessage = 'Erreur inconnue';
                        if (error.response && error.response.data) {
                            errorMessage = error.response.data.error || JSON.stringify(error.response.data);
                        } else if (error.message) {
                            errorMessage = error.message;
                        }
                        
                        alert(`Erreur lors de la sauvegarde du poste: ${errorMessage}`);
                        this.isSavingShift = false;
                    }
                },
                cancel: () => {
                    window.removeEventListener('confirm-shift-save', this.shiftSaveHandlers.confirm);
                    window.removeEventListener('cancel-shift-save', this.shiftSaveHandlers.cancel);
                    this.shiftSaveHandlers = null;
                    this.isSavingShift = false;
                }
            };
            
            // Ajouter les nouveaux listeners
            window.addEventListener('confirm-shift-save', this.shiftSaveHandlers.confirm);
            window.addEventListener('cancel-shift-save', this.shiftSaveHandlers.cancel);
            
            // Afficher la modal
            window.dispatchEvent(new CustomEvent('show-save-modal', { 
                detail: modalData 
            }));
        },
        
        // Construire le résumé du poste pour la modal
        buildShiftSummary(shiftData) {
            // Récupérer le nom de l'opérateur
            const operatorSelect = document.getElementById('operator-select');
            const operatorName = operatorSelect?.options[operatorSelect.selectedIndex]?.text || 'Non défini';
            
            // Récupérer les statistiques depuis la session
            const stats = this.getShiftStatistics();
            
            let html = '<div class="shift-summary">';
            
            // Informations principales
            html += '<h6 class="mb-3">Informations du poste</h6>';
            html += '<table class="table table-sm">';
            html += `<tr><td><strong>ID Poste:</strong></td><td>${this.shiftId}</td></tr>`;
            html += `<tr><td><strong>Date:</strong></td><td>${new Date(shiftData.date).toLocaleDateString('fr-FR')}</td></tr>`;
            html += `<tr><td><strong>Opérateur:</strong></td><td>${operatorName}</td></tr>`;
            html += `<tr><td><strong>Vacation:</strong></td><td>${shiftData.vacation}</td></tr>`;
            html += `<tr><td><strong>Horaires:</strong></td><td>${shiftData.start_time} - ${shiftData.end_time}</td></tr>`;
            html += '</table>';
            
            // État machine
            html += '<h6 class="mb-3 mt-3">État machine</h6>';
            html += '<table class="table table-sm">';
            html += `<tr><td><strong>Début de poste:</strong></td><td>${shiftData.started_at_beginning ? 'Machine démarrée' : 'Machine arrêtée'}</td></tr>`;
            if (shiftData.meter_reading_start) {
                html += `<tr><td><strong>Métrage début:</strong></td><td>${shiftData.meter_reading_start} m</td></tr>`;
            }
            html += `<tr><td><strong>Fin de poste:</strong></td><td>${shiftData.started_at_end ? 'Machine démarrée' : 'Machine arrêtée'}</td></tr>`;
            if (shiftData.meter_reading_end) {
                html += `<tr><td><strong>Métrage fin:</strong></td><td>${shiftData.meter_reading_end} m</td></tr>`;
            }
            html += '</table>';
            
            // Statistiques de production
            html += '<h6 class="mb-3 mt-3">Production</h6>';
            html += '<table class="table table-sm">';
            html += `<tr><td><strong>Rouleaux créés:</strong></td><td>${stats.rollCount}</td></tr>`;
            html += `<tr><td><strong>Longueur totale:</strong></td><td>${stats.totalLength} m</td></tr>`;
            html += `<tr><td><strong>Temps perdu:</strong></td><td>${stats.lostTime} min</td></tr>`;
            html += '</table>';
            
            // Validation
            html += '<h6 class="mb-3 mt-3">Validation</h6>';
            html += '<table class="table table-sm">';
            html += `<tr><td><strong>Contrôle qualité:</strong></td><td>${this.qcStatus === 'completed' ? '✓ Complété' : '⚠ Non complété'}</td></tr>`;
            html += `<tr><td><strong>Checklist:</strong></td><td>${this.checklistSigned ? '✓ Signée' : '⚠ Non signée'}</td></tr>`;
            html += '</table>';
            
            // Commentaires
            if (shiftData.operator_comments) {
                html += '<h6 class="mb-3 mt-3">Commentaires</h6>';
                html += `<p class="text-muted">${shiftData.operator_comments}</p>`;
            }
            
            html += '</div>';
            
            return html;
        },
        
        // Obtenir les statistiques du poste
        getShiftStatistics() {
            // Compter les rouleaux depuis la session
            let rollCount = 0;
            let totalLength = 0;
            
            // Si on a des données de rouleaux dans la session
            if (window.sessionData && window.sessionData.rolls) {
                rollCount = window.sessionData.rolls.length;
                totalLength = window.sessionData.rolls.reduce((sum, roll) => {
                    return sum + (parseFloat(roll.length) || 0);
                }, 0);
            }
            
            // Temps perdu
            let lostTime = 0;
            if (window.sessionData && window.sessionData.lost_time_entries) {
                lostTime = window.sessionData.lost_time_entries.reduce((sum, entry) => {
                    return sum + (parseInt(entry.duration) || 0);
                }, 0);
            }
            
            return {
                rollCount,
                totalLength: totalLength.toFixed(1),
                lostTime
            };
        },
        
        // Réinitialiser le formulaire
        resetForm() {
            this.operatorId = '';
            this.shiftDate = '';
            this.vacation = '';
            this.startTime = '';
            this.endTime = '';
            this.machineStartedStart = false;
            this.machineStartedEnd = false;
            this.lengthStart = '';
            this.lengthEnd = '';
            this.comment = '';
            this.shiftId = null;
            this.isValid = false;
            this.hasValidId = false;
            this.qcStatus = 'pending';
            this.checklistSigned = false;
            this.hasStartupTime = false;
        }
    };
}