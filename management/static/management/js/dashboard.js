console.log('Dashboard JS loaded');

function managementDashboard() {
    console.log('managementDashboard function called');
    return {
        // État du dashboard
        kpis: {
            avg_trs: null,
            total_production: null,
            avg_quality: null,
            avg_availability: null
        },
        pendingChecklists: [],
        recentShifts: [],
        alerts: [],
        dailyTrends: [],
        trendChart: null,
        loading: true,
        
        // Initialisation
        init() {
            console.log('Dashboard init called');
            this.loadDashboardData();
            // Rafraîchissement automatique toutes les 30 secondes
            setInterval(() => this.loadDashboardData(), 30000);
        },
        
        // Chargement des données du dashboard
        async loadDashboardData() {
            try {
                console.log('Loading dashboard data...');
                const response = await fetch('/management/api/dashboard-stats/');
                if (!response.ok) throw new Error('Erreur lors du chargement');
                
                const data = await response.json();
                console.log('Dashboard data:', data);
                
                // Mise à jour des KPIs
                this.kpis = data.current_kpis || {};
                
                // Mise à jour des alertes
                this.alerts = data.alerts || [];
                
                // Mise à jour des tendances
                this.dailyTrends = data.daily_trends || [];
                
                // Charger les checklists en attente
                await this.loadPendingChecklists();
                
                // Charger les shifts récents
                await this.loadRecentShifts();
                
                // Mettre à jour le graphique
                this.updateTrendChart();
                
            } catch (error) {
                console.error('Erreur dashboard:', error);
                this.showError('Erreur lors du chargement des données');
            } finally {
                this.loading = false;
            }
        },
        
        // Chargement des checklists en attente
        async loadPendingChecklists() {
            try {
                const response = await fetch('/management/api/checklists/pending/');
                if (!response.ok) throw new Error('Erreur chargement checklists');
                
                const checklists = await response.json();
                // Ajouter les propriétés nécessaires pour le formulaire
                this.pendingChecklists = checklists.map(c => ({
                    ...c,
                    visa: '',
                    isSubmitting: false
                }));
            } catch (error) {
                console.error('Erreur checklists:', error);
                this.pendingChecklists = [];
            }
        },
        
        // Chargement des shifts récents
        async loadRecentShifts() {
            try {
                const response = await fetch('/management/api/shift-reports/recent/?days=7&limit=10');
                if (!response.ok) throw new Error('Erreur chargement shifts');
                
                this.recentShifts = await response.json();
            } catch (error) {
                console.error('Erreur shifts:', error);
                this.recentShifts = [];
            }
        },
        
        // Mise à jour du graphique de tendance
        updateTrendChart() {
            const ctx = document.getElementById('trendChart');
            if (!ctx) return;
            
            // Détruire le graphique existant
            if (this.trendChart) {
                this.trendChart.destroy();
            }
            
            // Préparer les données
            const labels = this.dailyTrends.map(d => this.formatDate(d.date));
            const productionData = this.dailyTrends.map(d => d.total_production);
            const trsData = this.dailyTrends.map(d => d.avg_trs);
            
            // Créer le nouveau graphique
            this.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Production (m)',
                            data: productionData,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            yAxisID: 'y-production',
                            tension: 0.4
                        },
                        {
                            label: 'TRS (%)',
                            data: trsData,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            yAxisID: 'y-trs',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false
                        }
                    },
                    scales: {
                        'y-production': {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Production (m)'
                            }
                        },
                        'y-trs': {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'TRS (%)'
                            },
                            min: 0,
                            max: 100,
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
        },
        
        // Formatage des nombres
        formatNumber(value) {
            if (!value) return '0';
            return new Intl.NumberFormat('fr-FR').format(Math.round(value));
        },
        
        // Formatage des dates
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit' 
            });
        },
        
        // Déterminer la classe CSS selon la valeur du TRS
        getTRSClass(trs) {
            if (trs >= 80) return 'bg-success';
            if (trs >= 60) return 'bg-warning';
            return 'bg-danger';
        },
        
        // Afficher une notification d'erreur
        showError(message) {
            this.showNotification(message, 'danger');
        },
        
        // Afficher une notification de succès
        showSuccess(message) {
            this.showNotification(message, 'success');
        },
        
        // Afficher une notification toast
        showNotification(message, type = 'info') {
            const toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                console.error('Container de toast non trouvé');
                alert(message); // Fallback
                return;
            }
            
            const toastHtml = `
                <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            `;
            
            const toastElement = document.createElement('div');
            toastElement.innerHTML = toastHtml;
            const toast = toastElement.firstElementChild;
            toastContainer.appendChild(toast);
            
            const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
            bsToast.show();
            
            toast.addEventListener('hidden.bs.toast', () => {
                toast.remove();
            });
        },
        
        // Remplir toutes les cases de visa
        fillAllVisas() {
            // Rechercher la première case avec un visa valide
            const firstFilledVisa = this.pendingChecklists.find(c => c.visa && c.visa.length >= 2)?.visa;
            
            if (!firstFilledVisa) {
                alert('Veuillez d\'abord remplir au moins une case avec vos initiales');
                return;
            }
            
            // Propager cette valeur dans toutes les cases vides
            this.pendingChecklists.forEach(checklist => {
                if (!checklist.visa) {
                    checklist.visa = firstFilledVisa;
                }
            });
        },
        
        // Valider un visa
        isValidVisa(visa) {
            return visa && visa.length >= 2;
        },
        
        // Envoyer la signature d'une checklist
        async sendChecklistSignature(checklist) {
            const response = await fetch(`/management/api/checklists/${checklist.id}/sign/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    visa: checklist.visa.toUpperCase()
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la signature');
            }
            
            return response;
        },
        
        // Signer une checklist individuelle
        async signChecklist(checklist) {
            if (!this.isValidVisa(checklist.visa)) {
                this.showError('Veuillez entrer des initiales valides (minimum 2 caractères)');
                return;
            }
            
            checklist.isSubmitting = true;
            
            try {
                await this.sendChecklistSignature(checklist);
                
                // Succès - retirer la checklist de la liste
                this.pendingChecklists = this.pendingChecklists.filter(c => c.id !== checklist.id);
                this.showSuccess(`Checklist ${checklist.shift_id} visée avec succès`);
                
            } catch (error) {
                console.error('Erreur:', error);
                this.showError(`Erreur lors de la signature : ${error.message}`);
                checklist.isSubmitting = false;
            }
        },
        
        // Vérifier si on peut signer toutes les checklists visibles
        canSignAll() {
            return this.pendingChecklists.slice(0, 5).every(c => this.isValidVisa(c.visa));
        },
        
        // Signer toutes les checklists visibles
        async signAllChecklists() {
            // Traiter uniquement les checklists visibles (maximum 5)
            const checklistsToSign = this.pendingChecklists.slice(0, 5).filter(c => this.isValidVisa(c.visa));
            
            if (checklistsToSign.length === 0) {
                this.showError('Veuillez remplir au moins une case avec des initiales valides (minimum 2 caractères)');
                return;
            }
            
            // Marquer toutes les checklists comme en cours de traitement
            checklistsToSign.forEach(c => c.isSubmitting = true);
            
            let successCount = 0;
            let failures = [];
            
            // Traiter les signatures en séquence pour éviter les conflits SQLite
            for (const checklist of checklistsToSign) {
                try {
                    await this.sendChecklistSignature(checklist);
                    
                    // Signature réussie
                    successCount++;
                    // Retirer immédiatement la checklist signée
                    this.pendingChecklists = this.pendingChecklists.filter(c => c.id !== checklist.id);
                    
                } catch (error) {
                    failures.push({
                        checklist,
                        error: error.message
                    });
                    checklist.isSubmitting = false;
                }
            }
            
            // Afficher le résumé
            if (successCount > 0) {
                this.showSuccess(`${successCount} checklist(s) visée(s) avec succès`);
            }
            
            if (failures.length > 0) {
                const errorMsg = failures.map(f => `${f.checklist.shift_id}: ${f.error}`).join('<br>');
                this.showError(`Erreur pour ${failures.length} checklist(s):<br>${errorMsg}`);
            }
        }
    }
}