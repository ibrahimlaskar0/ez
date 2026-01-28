const express = require('express');
const router = express.Router();

const { query } = require('../db/pg');

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Admin routes working!' 
    });
});

// PATCH /api/admin/payment-status
router.patch('/payment-status', async (req, res) => {
    try {
        const { registrationId, status } = req.body || {};
        if (!registrationId || !status) {
            return res.status(400).json({ success: false, message: 'registrationId and status are required' });
        }
        if (!['pending', 'confirmed', 'failed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Set payment_date only when confirming, clear when pending/failed
        let setDate = '';
        if (status === 'confirmed') {
            setDate = ', payment_date = now()';
        } else if (status === 'pending') {
            setDate = ', payment_date = NULL';
        }
        
        const { rowCount } = await query(
            `UPDATE registrations SET payment_status = $1${setDate} WHERE registration_id = $2`,
            [status, registrationId]
        );
        if (!rowCount) return res.status(404).json({ success: false, message: 'Registration not found' });
        return res.json({ success: true, message: 'Payment status updated', data: { registrationId, paymentStatus: status } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
    }
});

// PATCH /api/admin/bulk-payment-status
router.patch('/bulk-payment-status', async (req, res) => {
    try {
        const { category, status } = req.body || {};
        if (!category || !status) {
            return res.status(400).json({ success: false, message: 'category and status are required' });
        }
        if (!['pending', 'confirmed', 'failed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Set payment_date only when confirming, clear when pending/failed
        let setDate = '';
        if (status === 'confirmed') {
            setDate = ', payment_date = now()';
        } else if (status === 'pending') {
            setDate = ', payment_date = NULL';
        }
        
        const result = await query(
            `UPDATE registrations SET payment_status = $1${setDate} WHERE event_category = $2`,
            [status, category]
        );
        return res.json({ success: true, message: 'Bulk update complete', data: { modified: result.rowCount } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Bulk update failed', error: err.message });
    }
});

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
    try {
        const total = await query(`SELECT COUNT(*)::int AS count FROM registrations`);
        const pending = await query(`SELECT COUNT(*)::int AS count FROM registrations WHERE payment_status = 'pending'`);
        const revenue = await query(`SELECT COALESCE(SUM(event_fee),0)::numeric AS total FROM registrations WHERE payment_status = 'confirmed'`);
        const categoryWise = await query(`
          SELECT event_category AS _id,
                 COUNT(*)::int AS count,
                 COALESCE(SUM(CASE WHEN payment_status='confirmed' THEN event_fee ELSE 0 END),0)::numeric AS revenue
          FROM registrations
          GROUP BY event_category
        `);
        return res.json({ success: true, data: {
          totalRegistrations: total.rows[0].count,
          pendingPayments: pending.rows[0].count,
          totalRevenue: revenue.rows[0].total,
          categoryWise: categoryWise.rows
        } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to get stats', error: err.message });
    }
});

// GET /api/admin/image/:registrationId/:type
router.get('/image/:registrationId/:type', async (req, res) => {
  try {
    const { registrationId, type } = req.params;
    
    if (!['id-proof', 'payment-proof'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid image type. Must be id-proof or payment-proof' 
      });
    }
    
    const { rows } = await query(
      `SELECT 
        registration_id,
        participant_name,
        participant_email,
        college_id_filename,
        college_id_original_name,
        payment_proof
      FROM registrations 
      WHERE registration_id = $1`,
      [registrationId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registration not found' 
      });
    }
    
    const registration = rows[0];
    
    if (type === 'id-proof') {
      if (!registration.college_id_filename) {
        return res.status(404).json({ 
          success: false, 
          message: 'ID proof not found for this registration' 
        });
      }
      
      const url = (registration.college_id_path && /^https?:\/\//i.test(registration.college_id_path))
        ? registration.college_id_path
        : `/uploads/${registration.college_id_filename}`;
      return res.json({
        success: true,
        data: {
          type: 'id-proof',
          filename: registration.college_id_filename,
          originalName: registration.college_id_original_name,
          url,
          participant: {
            name: registration.participant_name,
            email: registration.participant_email
          }
        }
      });
    }
    
    if (type === 'payment-proof') {
      if (!registration.payment_proof) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment proof not found for this registration' 
        });
      }
      
      const paymentProof = typeof registration.payment_proof === 'string' 
        ? JSON.parse(registration.payment_proof) 
        : registration.payment_proof;
        
      return res.json({
        success: true,
        data: {
          type: 'payment-proof',
          filename: paymentProof.filename,
          originalName: paymentProof.originalName,
          url: paymentProof.path,
          size: paymentProof.size,
          mimetype: paymentProof.mimetype,
          participant: {
            name: registration.participant_name,
            email: registration.participant_email
          }
        }
      });
    }
    
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get image information', 
      error: err.message 
    });
  }
});

module.exports = router;
