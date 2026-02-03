const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const router = express.Router();

const { query } = require('../db/pg');

// Detect deployment/storage (same as registration route)
const hasCloudinary = !!process.env.CLOUDINARY_URL;
const cloudinary = hasCloudinary ? require('cloudinary').v2 : null;
if (cloudinary) { cloudinary.config({ secure: true }); }

const isVercel = !!process.env.VERCEL;
let UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (isVercel) UPLOAD_DIR = '/tmp/uploads';

// Multer storage (memory for Cloudinary, disk otherwise)
const storage = hasCloudinary 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '');
        const safeExt = ext && ext.length <= 8 ? ext : '';
        cb(null, `${uuidv4()}${safeExt}`);
      },
    });

async function uploadToCloud(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `esplendidez/${folder}`, resource_type: 'auto' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

// Helper: compress image buffer
async function compressImageBuffer(inputBuffer) {
  return sharp(inputBuffer).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 72 }).toBuffer();
}

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
  return cb(new Error('Only images (png, jpg, jpeg, webp) or PDF files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 4.5 * 1024 * 1024 }, // 4.5MB
  fileFilter,
});

const uploadFields = upload.fields([
  { name: 'paymentScreenshot', maxCount: 1 },
]);

// Multer error handler wrapper
const handleMulterError = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size too large. Maximum allowed size is 4.5MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Too many files uploaded' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: 'Unexpected file field in upload' });
      }
      if (err.message === 'Only images (png, jpg, jpeg, webp) or PDF files are allowed') {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: 'File upload error: ' + (err.message || 'Unknown error') });
    }
    next();
  });
};

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Payment routes working!' 
    });
});

// POST /api/payment/verify
// Body: { registrationId: string, utrNumber: string } + optional file: paymentScreenshot
router.post('/verify', handleMulterError, async (req, res) => {
    try {
        const { registrationId, utrNumber } = req.body || {};
        if (!registrationId || !utrNumber) {
            return res.status(400).json({ success: false, message: 'registrationId and UTR are required' });
        }

        const normalized = String(utrNumber).trim().toUpperCase().replace(/\s+/g, '');
        if (!/^[A-Z0-9]{6,50}$/.test(normalized)) {
            return res.status(400).json({ success: false, message: 'Invalid UTR format' });
        }

        // Handle optional payment screenshot
        let paymentProof = null;
        const payFile = (req.files && req.files.paymentScreenshot && req.files.paymentScreenshot[0]) || null;
        if (payFile) {
            try {
                if (hasCloudinary) {
                    if (/^image\//i.test(payFile.mimetype)) {
                        try {
                            const buf = await compressImageBuffer(payFile.buffer);
                            if (buf.length < payFile.size) {
                                payFile.buffer = buf;
                                payFile.mimetype = 'image/jpeg';
                            }
                        } catch (e) { /* compression failed; send original */ }
                    }
                    const up = await uploadToCloud(payFile, 'payment-proof');
                    paymentProof = {
                        filename: (up.public_id && up.format) ? `${up.public_id.split('/').pop()}.${up.format}` : (payFile.originalname || 'payment'),
                        originalName: payFile.originalname,
                        path: up.secure_url,
                        size: (up.bytes || payFile.size),
                        mimetype: payFile.mimetype,
                    };
                } else {
                    if (/^image\//i.test(payFile.mimetype)) {
                        const oldPath = path.join(UPLOAD_DIR, payFile.filename);
                        const newFilename = `${path.parse(payFile.filename).name}.jpg`;
                        const newPath = path.join(UPLOAD_DIR, newFilename);
                        try {
                            await sharp(oldPath).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
                                .jpeg({ quality: 72 }).toFile(newPath);
                            try { fs.unlinkSync(oldPath); } catch (e) { /* ignore cleanup error */ }
                            const { size } = fs.statSync(newPath);
                            payFile.filename = newFilename;
                            payFile.mimetype = 'image/jpeg';
                            payFile.size = size;
                        } catch (e) { /* compression failed; keep original */ }
                    }
                    paymentProof = {
                        filename: payFile.filename,
                        originalName: payFile.originalname,
                        path: `/uploads/${payFile.filename}`,
                        size: payFile.size,
                        mimetype: payFile.mimetype,
                    };
                }
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Failed to process payment screenshot file' });
            }
        }

        try {
            // Update registration with UTR, payment status, and optional payment proof
            const updateQuery = paymentProof
                ? `UPDATE registrations SET utr_number = $1, payment_status = 'confirmed', payment_date = now(), payment_proof = $3 WHERE registration_id = $2`
                : `UPDATE registrations SET utr_number = $1, payment_status = 'confirmed', payment_date = now() WHERE registration_id = $2`;
            
            const params = paymentProof
                ? [normalized, registrationId, JSON.stringify(paymentProof)]
                : [normalized, registrationId];
            
            const { rowCount } = await query(updateQuery, params);
            
            if (!rowCount) {
                return res.status(404).json({ success: false, message: 'Registration not found' });
            }
            return res.json({ success: true, message: 'Payment verified successfully', data: { registrationId, paymentStatus: 'confirmed', utr: normalized } });
        } catch (err) {
            if (err && (err.code === '23505' || /duplicate key/i.test(err.message))) {
                return res.status(409).json({ success: false, message: 'UTR already used for another registration' });
            }
            throw err;
        }
    } catch (err) {
        console.error('Payment verification error:', err);
        return res.status(500).json({ success: false, message: 'Payment verification failed', error: err.message });
    }
});

module.exports = router;
