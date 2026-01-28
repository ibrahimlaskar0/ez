/**
 * Esplendidez 2026 - API Configuration
 * Handles all backend API communications
 * Version: 2.0
 */

// API Configuration
const DEFAULT_API_PORT = 5001;

function resolveApiBase() {
    try {
        // Allow explicit overrides first
        const explicit = (window.ESPL_API_BASE || localStorage.getItem('API_BASE') || '').trim();
        if (explicit) {
            return explicit.replace(/\/+$/, '') + '/api';
        }

        // Derive from current location, handle file:// and empty host cases
        let host = window.location && window.location.hostname ? window.location.hostname : '';
        if (!host || (window.location && window.location.protocol === 'file:')) {
            host = '127.0.0.1';
        }

        const port = Number(localStorage.getItem('API_PORT')) || DEFAULT_API_PORT;
        return `http://${host}:${port}/api`;
    } catch (_) {
        // Safe fallback
        return `http://127.0.0.1:${DEFAULT_API_PORT}/api`;
    }
}

const API_CONFIG = {
    BASE_URL: resolveApiBase(),
    HEADERS: {
        'Accept': 'application/json'
    }
};

/**
 * API Helper Functions
 */
class ApiService {
    static async makeRequest(endpoint, options = {}) {
        const { silent = false, ...fetchOptions } = options || {};
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const isFormData = fetchOptions && fetchOptions.body && typeof FormData !== 'undefined' && (fetchOptions.body instanceof FormData);
        
        // Build headers - add Content-Type for JSON bodies
        let headers = {};
        if (isFormData) {
            // For FormData, don't set Content-Type (browser will set it with boundary)
            headers = { ...(fetchOptions.headers || {}) };
        } else {
            // For JSON bodies, add Content-Type header
            headers = { 
                'Content-Type': 'application/json',
                ...API_CONFIG.HEADERS, 
                ...(fetchOptions.headers || {}) 
            };
        }
        
        const config = {
            ...fetchOptions,
            headers,
        };

        try {
            const response = await fetch(url, config);
            const ct = (response.headers.get('content-type') || '').toLowerCase();
            let data;
            if (ct.includes('application/json')) {
                data = await response.json();
            } else if (ct.includes('text/')) {
                const text = await response.text();
                try { data = JSON.parse(text); } catch (_) { data = { message: text }; }
            } else {
                // Fallback: try text first, then blob
                try {
                    const text = await response.text();
                    try { data = JSON.parse(text); } catch (_) { data = { message: text }; }
                } catch (_) {
                    data = { message: `HTTP ${response.status}` };
                }
            }

            if (!response.ok) {
                const msg = (data && data.message) ? data.message : (response.status === 404 ? 'API endpoint not found' : `HTTP error! status: ${response.status}`);
                throw new Error(msg);
            }

            return data;
        } catch (error) {
            if (!silent) {
                console.error('API Error:', error);
            }
            throw error;
        }
    }

    // Health Check
    static async checkHealth() {
        return await this.makeRequest('/health');
    }

    // Registration APIs
    static async registerForEvent(registrationData) {
        return await this.makeRequest('/registration/register', {
            method: 'POST',
            body: JSON.stringify(registrationData)
        });
    }

    // Multipart registration (with file)
    static async registerForEventMultipart(formData) {
        return await this.makeRequest('/registration/register', {
            method: 'POST',
            body: formData
        });
    }

    static async getAllRegistrations() {
        return await this.makeRequest('/registration/all');
    }

    static async getRegistrationsByCategory(category) {
        return await this.makeRequest(`/registration/category/${category}`);
    }

    static async getRegistrationsByEvent(eventName) {
        return await this.makeRequest(`/registration/event/${encodeURIComponent(eventName)}`);
    }

    // Admin APIs
    static async adminLogin(credentials) {
        return await this.makeRequest('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    static async updatePaymentStatus(registrationId, status) {
        return await this.makeRequest('/admin/payment-status', {
            method: 'PATCH',
            body: JSON.stringify({ registrationId, status })
        });
    }

    static async bulkUpdatePaymentStatus(category, status) {
        return await this.makeRequest('/admin/bulk-payment-status', {
            method: 'PATCH',
            body: JSON.stringify({ category, status })
        });
    }

    static async exportRegistrations(format = 'excel', category = null) {
        const endpoint = category 
            ? `/admin/export/${format}?category=${category}`
            : `/admin/export/${format}`;
        
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            headers: API_CONFIG.HEADERS
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        return response.blob();
    }

    // Payment APIs
    static async verifyPayment(utrNumber, registrationId) {
        return await this.makeRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({ utrNumber, registrationId })
        });
    }

    // Image viewing APIs
    static async getImageInfo(registrationId, type) {
        // Use silent mode so missing metadata endpoints don't spam the console
        return await this.makeRequest(`/admin/image/${registrationId}/${type}`, { silent: true });
    }

    static getImageUrl(filenameOrUrl) {
        if (!filenameOrUrl) return '';
        const s = String(filenameOrUrl);
        if (/^https?:\/\//i.test(s)) return s; // absolute URL (e.g., Cloudinary)
        const safe = encodeURIComponent(s);
        return `${API_CONFIG.BASE_URL.replace('/api', '')}/uploads/${safe}`;
    }
}

// Fallback to localStorage if backend is not available
class FallbackStorage {
    static isBackendAvailable = true;

    static async checkBackendAvailability() {
        try {
            await ApiService.checkHealth();
            this.isBackendAvailable = true;
            return true;
        } catch (error) {
            console.warn('Backend not available, falling back to localStorage');
            this.isBackendAvailable = false;
            return false;
        }
    }

    static async getRegistrations() {
        if (this.isBackendAvailable) {
            try {
                const response = await ApiService.getAllRegistrations();
                return response.data || response.registrations || [];
            } catch (error) {
                console.warn('Backend failed, using localStorage');
                this.isBackendAvailable = false;
            }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem('registrations');
        return stored ? JSON.parse(stored) : [];
    }

    static async saveRegistration(registrationData) {
        if (this.isBackendAvailable) {
            try {
                return await ApiService.registerForEvent(registrationData);
            } catch (error) {
                console.warn('Backend failed, saving to localStorage');
                this.isBackendAvailable = false;
            }
        }
        
        // Fallback to localStorage
        const registrations = await this.getRegistrations();
        const newRegistration = {
            ...registrationData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        registrations.push(newRegistration);
        localStorage.setItem('registrations', JSON.stringify(registrations));
        return { success: true, data: newRegistration };
    }
}

// Initialize backend availability check
document.addEventListener('DOMContentLoaded', async () => {
    await FallbackStorage.checkBackendAvailability();
    console.log('Backend availability:', FallbackStorage.isBackendAvailable ? 'Available' : 'Not Available');
});

// Export for global use
window.ApiService = ApiService;
window.FallbackStorage = FallbackStorage;