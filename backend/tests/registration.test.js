const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Registration Endpoint Tests', () => {
  describe('POST /api/registration/register - Validation Errors', () => {
    it('should return 400 with message for missing required fields', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('participantName', 'Test User')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Validation failed/i);
    });

    it('should return 400 with message for missing college ID file', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('eventName', 'Tech Quiz')
        .field('eventCategory', 'Technical')
        .field('eventFee', '100')
        .field('participantName', 'John Doe')
        .field('participantEmail', 'john@example.com')
        .field('participantPhone', '9876543210')
        .field('participantCollege', 'Test College')
        .field('participantRoll', 'TC001')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('College ID proof file is required');
    });

    it('should return 400 with message for invalid email format', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('eventName', 'Tech Quiz')
        .field('eventCategory', 'Technical')
        .field('eventFee', '100')
        .field('participantName', 'John Doe')
        .field('participantEmail', 'invalid-email')
        .field('participantPhone', '9876543210')
        .field('participantCollege', 'Test College')
        .field('participantRoll', 'TC001')
        .attach('collegeIdProof', Buffer.from('fake-image'), 'test.jpg')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/email/i);
    });

    it('should return 400 with message for invalid phone number', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('eventName', 'Tech Quiz')
        .field('eventCategory', 'Technical')
        .field('eventFee', '100')
        .field('participantName', 'John Doe')
        .field('participantEmail', 'john@example.com')
        .field('participantPhone', '12345')
        .field('participantCollege', 'Test College')
        .field('participantRoll', 'TC001')
        .attach('collegeIdProof', Buffer.from('fake-image'), 'test.jpg')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/phone/i);
    });

    it('should return 400 with message for invalid event category', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('eventName', 'Test Event')
        .field('eventCategory', 'InvalidCategory')
        .field('eventFee', '100')
        .field('participantName', 'John Doe')
        .field('participantEmail', 'john@example.com')
        .field('participantPhone', '9876543210')
        .field('participantCollege', 'Test College')
        .field('participantRoll', 'TC001')
        .attach('collegeIdProof', Buffer.from('fake-image'), 'test.jpg')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/category/i);
    });
  });

  describe('POST /api/registration/register - File Upload Errors', () => {
    it('should return 400 with message for unsupported file type', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('eventName', 'Tech Quiz')
        .field('eventCategory', 'Technical')
        .field('eventFee', '100')
        .field('participantName', 'John Doe')
        .field('participantEmail', 'john@example.com')
        .field('participantPhone', '9876543210')
        .field('participantCollege', 'Test College')
        .field('participantRoll', 'TC001')
        .attach('collegeIdProof', Buffer.from('fake-file-content'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/images|PDF|allowed/i);
    });
  });

  describe('POST /api/registration/register - Response Format', () => {
    it('should not include registrationId in error responses', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('participantName', 'Test User')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).not.toHaveProperty('registrationId');
    });

    it('error response should have user-friendly message field', async () => {
      const res = await request(app)
        .post('/api/registration/register')
        .field('participantName', 'Test User')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/registration/test', () => {
    it('should return success response', async () => {
      const res = await request(app)
        .get('/api/registration/test')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });
  });
});
