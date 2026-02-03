/**
 * Manual test script to verify JSON and Multipart registration flows
 * Run with: node manual-test.js
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./server');

async function testJSONRegistration() {
    console.log('\n🧪 Testing JSON Registration (from registration-form.js)...');
    
    const jsonData = {
        eventName: 'Quiz',
        eventCategory: 'Competitions',
        eventFee: 150,
        participantName: 'JSON Test User',
        email: `json-manual-${Date.now()}@example.com`,
        phone: '9876543210',
        college: 'Test College',
        // Note: No participantRoll, no collegeIdProof file
    };
    
    try {
        const res = await request(app)
            .post('/api/registration/register')
            .set('Content-Type', 'application/json')
            .send(jsonData);
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.body, null, 2));
        
        if (res.status === 201) {
            console.log('✅ JSON Registration SUCCESS');
        } else {
            console.log('❌ JSON Registration FAILED');
        }
    } catch (error) {
        console.error('❌ JSON Registration ERROR:', error.message);
    }
}

async function testMultipartWithFile() {
    console.log('\n🧪 Testing Multipart Registration with File (from registration.js)...');
    
    // Create minimal test image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
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
    
    try {
        const res = await request(app)
            .post('/api/registration/register')
            .field('eventName', 'Debate')
            .field('eventCategory', 'Competitions')
            .field('eventFee', '150')
            .field('participantName', 'Multipart Test User')
            .field('participantEmail', `multipart-manual-${Date.now()}@example.com`)
            .field('participantPhone', '9876543210')
            .field('participantCollege', 'Test College')
            .field('participantRoll', 'ROLL123')
            .attach('collegeIdProof', testImagePath);
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.body, null, 2));
        
        if (res.status === 201) {
            console.log('✅ Multipart Registration SUCCESS');
        } else {
            console.log('❌ Multipart Registration FAILED');
        }
    } catch (error) {
        console.error('❌ Multipart Registration ERROR:', error.message);
    } finally {
        // Cleanup
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    }
}

async function testMultipartWithoutFile() {
    console.log('\n🧪 Testing Multipart Registration WITHOUT File (should fail)...');
    
    try {
        const res = await request(app)
            .post('/api/registration/register')
            .field('eventName', 'Quiz')
            .field('eventCategory', 'Competitions')
            .field('eventFee', '150')
            .field('participantName', 'Test User')
            .field('participantEmail', `multipart-nofile-${Date.now()}@example.com`)
            .field('participantPhone', '9876543210')
            .field('participantCollege', 'Test College')
            .field('participantRoll', 'ROLL456');
        
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.body, null, 2));
        
        if (res.status === 400 && res.body.message === 'College ID proof file is required') {
            console.log('✅ Multipart WITHOUT File correctly REJECTED');
        } else {
            console.log('❌ Multipart WITHOUT File should have returned 400');
        }
    } catch (error) {
        console.error('❌ Multipart WITHOUT File ERROR:', error.message);
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Manual Registration Endpoint Tests');
    console.log('═══════════════════════════════════════════════════════════');
    
    await testJSONRegistration();
    await testMultipartWithFile();
    await testMultipartWithoutFile();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Tests Complete');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Close DB connection
    const { pool } = require('./db/pg');
    await pool.end();
    process.exit(0);
}

runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
