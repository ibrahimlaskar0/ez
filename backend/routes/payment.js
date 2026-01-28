const express = require('express');
const router = express.Router();

const { query } = require('../db/pg');

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Payment routes working!' 
    });
});

// POST /api/payment/verify
// Body: { registrationId: string, utrNumber: string }
router.post('/verify', async (req, res) => {
    try {
        const { registrationId, utrNumber } = req.body || {};
        if (!registrationId || !utrNumber) {
            return res.status(400).json({ success: false, message: 'registrationId and UTR are required' });
        }

        const normalized = String(utrNumber).trim().toUpperCase().replace(/\s+/g, '');
        if (!/^[A-Z0-9]{6,50}$/.test(normalized)) {
            return res.status(400).json({ success: false, message: 'Invalid UTR format' });
        }

        try {
            const { rowCount } = await query(
                `UPDATE registrations SET utr_number = $1, payment_status = 'confirmed', payment_date = now() WHERE registration_id = $2`,
                [normalized, registrationId]
            );
            if (!rowCount) {
                return res.status(404).json({ success: false, message: 'Registration not found' });
            }
            return res.json({ success: true, message: 'Payment verified', data: { registrationId, paymentStatus: 'confirmed', utr: normalized } });
        } catch (err) {
            if (err && (err.code === '23505' || /duplicate key/i.test(err.message))) {
                return res.status(409).json({ success: false, message: 'UTR already used' });
            }
            throw err;
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Payment verification failed', error: err.message });
    }
});

module.exports = router;
