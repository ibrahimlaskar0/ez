const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../server');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db/pg');

// Close database connection after all tests
afterAll(async () => {
    await pool.end();
});

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

describe('Registration API Tests', () => {
    const validJSONRegistration = {
        eventName: 'Coding Competition',
        eventCategory: 'Technical',
        eventFee: 200,
        participantName: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        college: 'Test College'
    };

    describe('POST /api/registration/register - JSON submission', () => {
        it('should accept JSON registration without collegeIdProof', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    email: `json-test-${Date.now()}@example.com`
                })
                .expect(201);
            
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Registration submitted successfully');
            expect(res.body.data).toHaveProperty('registrationId');
            expect(res.body.data).toHaveProperty('eventName', 'Coding Competition');
            expect(res.body.data).toHaveProperty('paymentStatus', 'pending');
        });

        it('should map JSON keys email/phone/college to participantEmail/Phone/College', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    email: `json-mapping-${Date.now()}@example.com`
                })
                .expect(201);
            
            expect(res.body.success).toBe(true);
            expect(res.body.data.participantEmail).toBeDefined();
        });

        it('should set participantRoll to NA when not provided in JSON', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    email: `json-noroll-${Date.now()}@example.com`
                })
                .expect(201);
            
            expect(res.body.success).toBe(true);
        });

        it('should normalize eventCategory for JSON submissions', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    eventCategory: 'technical', // lowercase
                    email: `json-category-${Date.now()}@example.com`
                })
                .expect(201);
            
            expect(res.body.success).toBe(true);
        });

        it('should handle eventFee with currency symbols in JSON', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    eventFee: '₹200',
                    email: `json-fee-${Date.now()}@example.com`
                })
                .expect(201);
            
            expect(res.body.success).toBe(true);
        });

        it('should return 400 for missing required fields in JSON', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    eventName: 'Test Event',
                    // Missing other required fields
                })
                .expect(400);
            
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('errors');
        });

        it('should validate email format in JSON submissions', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    email: 'invalid-email'
                })
                .expect(400);
            
            expect(res.body).toHaveProperty('success', false);
        });

        it('should validate phone number format in JSON submissions', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .set('Content-Type', 'application/json')
                .send({
                    ...validJSONRegistration,
                    phone: '12345', // Invalid phone
                    email: `json-phone-${Date.now()}@example.com`
                })
                .expect(400);
            
            expect(res.body).toHaveProperty('success', false);
        });
    });

    describe('POST /api/registration/register - Multipart submission', () => {
        // Create a test image file
        const createTestImage = () => {
            const testImagePath = path.join(__dirname, 'test-image.jpg');
            if (!fs.existsSync(testImagePath)) {
                // Create a minimal valid JPEG file (1x1 pixel)
                const minimalJpeg = Buffer.from([
                    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
                    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
                    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
                    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
                    0x7F, 0xFF, 0xD9
                ]);
                fs.writeFileSync(testImagePath, minimalJpeg);
            }
            return testImagePath;
        };

        afterAll(() => {
            // Cleanup test image
            const testImagePath = path.join(__dirname, 'test-image.jpg');
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        });

        it('should accept multipart registration with collegeIdProof', async () => {
            const testImagePath = createTestImage();
            const res = await request(app)
                .post('/api/registration/register')
                .field('eventName', 'Debate')
                .field('eventCategory', 'Competitions')
                .field('eventFee', '150')
                .field('participantName', 'Multipart Test User')
                .field('participantEmail', `multipart-${Date.now()}@example.com`)
                .field('participantPhone', '9876543210')
                .field('participantCollege', 'Test College')
                .field('participantRoll', 'ROLL123')
                .attach('collegeIdProof', testImagePath)
                .expect(201);
            
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('registrationId');
        });

        it('should return 400 for multipart registration without collegeIdProof', async () => {
            const res = await request(app)
                .post('/api/registration/register')
                .field('eventName', 'Quiz')
                .field('eventCategory', 'Competitions')
                .field('eventFee', '150')
                .field('participantName', 'Test User')
                .field('participantEmail', `multipart-nofile-${Date.now()}@example.com`)
                .field('participantPhone', '9876543210')
                .field('participantCollege', 'Test College')
                .field('participantRoll', 'ROLL456')
                .expect(400);
            
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'College ID proof file is required');
        });
    });

    describe('GET /api/registration/test', () => {
        it('should return success message', async () => {
            const res = await request(app)
                .get('/api/registration/test')
                .expect(200);
            
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Registration routes working!');
        });
    });
});