const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Auth routes working!' 
    });
});

// TODO: Add actual authentication routes
// POST /login
// POST /register
// POST /logout
// GET /profile

module.exports = router;