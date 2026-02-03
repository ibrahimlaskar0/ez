const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('API Health and Basic Tests', () => {
    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const res = await request(app)
                .get('/api/health')
                .expect(200);
            
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Esplendidez 2026 Backend Server is running');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('uptime');
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for non-existent API routes', async () => {
            const res = await request(app)
                .get('/api/nonexistent')
                .expect(404);
            
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'API endpoint not found');
        });
    });

    describe('CORS and Security Headers', () => {
        it('should include CORS headers when Origin is provided', async () => {
            const origin = 'http://localhost:3000';
            const res = await request(app)
                .get('/api/health')
                .set('Origin', origin)
                .expect(200);
            
            expect(res.headers['access-control-allow-origin']).toBe(origin);
        });
    });

    describe('Rate Limiting', () => {
        it('should accept requests within rate limit', async () => {
            await request(app)
                .get('/api/health')
                .expect(200);
        });
    });
});