// API Handler
class API {
    constructor() {
        this.baseUrl = window.location.origin + '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.token = null;
    }

    setAuthToken(token) {
        this.token = token;
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }

    getHeaders() {
        return { ...this.defaultHeaders };
    }

    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            return data;
        }
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.text();
    }

    async post(endpoint, data) {
        console.log(`Making POST request to ${endpoint}:`, data);
        try {
            const response = await fetch(this.baseUrl + endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await this.handleResponse(response);
            console.log(`POST ${endpoint} response:`, result);
            return result;
        } catch (error) {
            console.error(`POST ${endpoint} error:`, error);
            throw error;
        }
    }

    async get(endpoint) {
        console.log(`Making GET request to ${endpoint}`);
        try {
            const response = await fetch(this.baseUrl + endpoint, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const result = await this.handleResponse(response);
            console.log(`GET ${endpoint} response:`, result);
            return result;
        } catch (error) {
            console.error(`GET ${endpoint} error:`, error);
            throw error;
        }
    }

    // User endpoints
    async getUser() {
        return this.get('/user');
    }

    // Bull endpoints
    async getBulls() {
        return this.get('/bulls');
    }

    async createBull(name) {
        return this.post('/bulls', { name });
    }

    async trainBull(bullId, attribute) {
        return this.post(`/bulls/${bullId}/train`, { attribute });
    }

    async feedBull(bullId) {
        return this.post(`/bulls/${bullId}/feed`);
    }

    async getShopItems() {
        return this.get('/shop/items');
    }

    async purchaseItem(itemId) {
        return this.post(`/shop/purchase`, { itemId });
    }
}

// Initialize API
const api = new API();
