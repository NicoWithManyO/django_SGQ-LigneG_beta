// Module API centralisé
const api = {
    // Configuration de base
    endpoints: {
        session: '/api/session/',
        lostTimeReasons: '/api/lost-time-reasons/',
        lostTimeEntries: '/api/lost-time-entries/',
        checklistTemplate: '/api/checklist-template-default/',
        checklistResponses: '/api/checklist-responses/'
    },

    // Headers par défaut pour les requêtes
    getHeaders(includeContentType = true) {
        const headers = {
            'X-CSRFToken': utils.getCsrfToken()
        };
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    },

    // Gestion des erreurs uniformisée
    async handleResponse(response) {
        if (!response.ok) {
            console.error(`Erreur API: ${response.status} ${response.statusText}`);
            throw new Error(`Erreur API: ${response.status}`);
        }
        return response;
    },

    // Méthode générique pour sauvegarder en session
    async saveToSession(data) {
        try {
            const response = await fetch(this.endpoints.session, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            await this.handleResponse(response);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde en session:', error);
            return false;
        }
    },

    // Méthode générique GET
    async get(endpoint, params = {}) {
        try {
            const url = new URL(endpoint, window.location.origin);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            await this.handleResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`Erreur GET ${endpoint}:`, error);
            throw error;
        }
    },

    // Méthode générique POST
    async post(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            await this.handleResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`Erreur POST ${endpoint}:`, error);
            throw error;
        }
    },

    // Méthode générique DELETE
    async delete(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: this.getHeaders(false)
            });
            
            await this.handleResponse(response);
            return true;
        } catch (error) {
            console.error(`Erreur DELETE ${endpoint}:`, error);
            throw error;
        }
    },

    // Méthodes spécifiques pour les temps perdus
    async getLostTimeReasons() {
        return await this.get(this.endpoints.lostTimeReasons);
    },

    async getLostTimeEntries(shiftId = null) {
        const params = shiftId ? { shift_id: shiftId } : {};
        return await this.get(this.endpoints.lostTimeEntries, params);
    },

    async createLostTimeEntry(data) {
        return await this.post(this.endpoints.lostTimeEntries, data);
    },

    async deleteLostTimeEntry(id) {
        return await this.delete(`${this.endpoints.lostTimeEntries}${id}/`);
    },

    // Méthodes spécifiques pour la checklist
    async getChecklistTemplate() {
        return await this.get(this.endpoints.checklistTemplate);
    },

    async getChecklistResponses(shiftId) {
        return await this.get(this.endpoints.checklistResponses, { shift_id: shiftId });
    },

    async saveChecklistResponse(data) {
        return await this.post(this.endpoints.checklistResponses, data);
    }
};