const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const sharp = require('sharp');

const { query } = require('../db/pg');

const router = express.Router();

// Local CORS (inherits global but ensures route-level if needed)
router.use(cors());

// Detect deployment/storage
const hasCloudinary = !!process.env.CLOUDINARY_URL;  // Check if URL exists
const cloudinary = hasCloudinary ? require('cloudinary').v2 : null;  // Load SDK
if (cloudinary) { cloudinary.config({ secure: true }); }  // Auto-configure from CLOUDINARY_URL

const isVercel = !!process.env.VERCEL;
let UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (isVercel) UPLOAD_DIR = '/tmp/uploads';
// if (!hasCloudinary) { try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { /* directory may already exist */ } }

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
// const cloudinary = hasCloudinary ? require('cloudinary').v2 : null;
if (cloudinary) { cloudinary.config({ secure: true }); }

async function uploadToCloud(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `esplendidez/${folder}`, resource_type: 'auto' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

// Helper: compress image buffer (JPEG, max 1600px, q=72)
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
  // keep slightly under typical platform limits to avoid rejections before server logic runs
  limits: { fileSize: 4.5 * 1024 * 1024 }, // 4.5MB
  fileFilter,
});

const uploadFields = upload.fields([
  { name: 'collegeIdProof', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 },
]);

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'E-Sports', 'Competitions'];

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Registration routes working!' });
});

// POST /api/registration/register
router.post(
  '/register',
  uploadFields,
  [
    body('eventName').trim().notEmpty().withMessage('Event name is required'),
    body('eventCategory')
      .isIn(CATEGORIES)
      .withMessage(`Event category must be one of: ${CATEGORIES.join(', ')}`),
    body('eventFee').isFloat({ min: 0 }).withMessage('Event fee must be a number >= 0'),

    body('participantName').trim().notEmpty().withMessage('Participant name is required'),
    body('participantEmail').isEmail().withMessage('Valid participant email is required')
      .normalizeEmail(),
    body('participantPhone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Participant phone must be a valid 10-digit Indian number'),
    body('participantCollege').trim().notEmpty().withMessage('Participant college is required'),
    body('participantRoll').trim().notEmpty().withMessage('Participant roll is required'),

    body('teamSize').optional().isInt({ min: 1, max: 20 }).toInt(),
    // UTR: accept alphanumeric, will be uppercased and spaces removed server-side
    body('utrNumber').optional().trim().isLength({ min: 6, max: 50 }).matches(/^[A-Za-z0-9]+$/).withMessage('UTR must be alphanumeric'),

    body('teamMembers').optional(), // Validated in handler after parsing
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Ensure file uploaded
      if (!(req.files && req.files.collegeIdProof && req.files.collegeIdProof[0])) {
        return res.status(400).json({ success: false, message: 'College ID proof file is required' });
      }

      // Parse teamMembers (may come as JSON string)
      let teamMembers = [];
      if (req.body.teamMembers) {
        try {
          teamMembers = Array.isArray(req.body.teamMembers)
            ? req.body.teamMembers
            : JSON.parse(req.body.teamMembers);

          // basic shape validation
          if (!Array.isArray(teamMembers)) throw new Error('teamMembers must be an array');
          teamMembers = teamMembers.map((m) => ({ name: String(m.name || '').trim(), email: String(m.email || '').trim() }))
            .filter((m) => m.name && /\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+/.test(m.email));
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid teamMembers format' });
        }
      }

      // Build collegeIdProof object
      const file = (req.files && req.files.collegeIdProof && req.files.collegeIdProof[0]) || null;
      let collegeIdProof = null;
      if (file) {
        if (hasCloudinary) {
          // If image, recompress buffer before uploading to reduce payload stored upstream
          if (/^image\//i.test(file.mimetype)) {
            try {
              const buf = await compressImageBuffer(file.buffer);
              if (buf.length < file.size) {
                file.buffer = buf;
                file.mimetype = 'image/jpeg';
              }
            } catch (e) { /* compression failed; send original */ }
          }
          const up = await uploadToCloud(file, 'id-proof');
          collegeIdProof = {
            filename: (up.public_id && up.format) ? `${up.public_id.split('/').pop()}.${up.format}` : (file.originalname || 'upload'),
            originalName: file.originalname,
            path: up.secure_url,
            size: (up.bytes || file.size),
            mimetype: file.mimetype,
          };
        } else {
          // For local disk, recompress to jpeg and replace file
          if (/^image\//i.test(file.mimetype)) {
            const oldPath = path.join(UPLOAD_DIR, file.filename);
            const newFilename = `${path.parse(file.filename).name}.jpg`;
            const newPath = path.join(UPLOAD_DIR, newFilename);
            try {
              await sharp(oldPath).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 72 }).toFile(newPath);
              try { fs.unlinkSync(oldPath); } catch (e) { /* ignore cleanup error */ }
              const { size } = fs.statSync(newPath);
              file.filename = newFilename;
              file.mimetype = 'image/jpeg';
              file.size = size;
            } catch (e) { /* compression failed; keep original */ }
          }
          const storedRelativePath = `/uploads/${file.filename}`; // served by server.js static route (maps to UPLOAD_DIR)
          collegeIdProof = {
            filename: file.filename,
            originalName: file.originalname,
            path: storedRelativePath,
            size: file.size,
            mimetype: file.mimetype,
          };
        }
      }

      // Generate registrationId (ESP2026####)
      const prefix = 'ESP2026'; // Esplendidez 2026
      const { rows: latestRows } = await query(
        `SELECT registration_id FROM registrations 
         WHERE registration_id LIKE $1 
         ORDER BY registration_id DESC 
         LIMIT 1`,
        [prefix + '%']
      );
      let nextNumber = 1;
      if (latestRows.length) {
        const num = parseInt(latestRows[0].registration_id.replace(prefix, ''));
        if (!isNaN(num)) nextNumber = num + 1;
      }
      const registrationId = `${prefix}${String(nextNumber).padStart(4, '0')}`;

      // Normalize UTR: uppercase and remove spaces
      const normalizedUTR = req.body.utrNumber
        ? String(req.body.utrNumber).trim().toUpperCase().replace(/\s+/g, '')
        : undefined;

      // Create registration payload
      const payload = {
        registrationId,
        eventName: req.body.eventName,
        eventCategory: req.body.eventCategory,
        eventFee: Number(req.body.eventFee),

        participantName: req.body.participantName,
        participantEmail: req.body.participantEmail,
        participantPhone: req.body.participantPhone,
        participantCollege: req.body.participantCollege,
        participantRoll: req.body.participantRoll,

        collegeIdProof,

        teamSize: req.body.teamSize ? Number(req.body.teamSize) : 1,
        teamName: req.body.teamName || undefined,
        teamCaptain: req.body.teamCaptain || undefined,
        teamMembers,

        paymentStatus: 'pending', // Always start as pending, admin must verify
        utrNumber: normalizedUTR,

        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      // Optional payment screenshot
      const payFile = (req.files && req.files.paymentScreenshot && req.files.paymentScreenshot[0]) || null;
      if (payFile) {
        if (hasCloudinary) {
          if (/^image\//i.test(payFile.mimetype)) {
            try {
              const buf2 = await compressImageBuffer(payFile.buffer);
              if (buf2.length < payFile.size) {
                payFile.buffer = buf2;
                payFile.mimetype = 'image/jpeg';
              }
            } catch (e) { /* compression failed; send original */ }
          }
          const up2 = await uploadToCloud(payFile, 'payment-proof');
          payload.paymentProof = {
            filename: (up2.public_id && up2.format) ? `${up2.public_id.split('/').pop()}.${up2.format}` : (payFile.originalname || 'payment'),
            originalName: payFile.originalname,
            path: up2.secure_url,
            size: (up2.bytes || payFile.size),
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
          payload.paymentProof = {
            filename: payFile.filename,
            originalName: payFile.originalname,
            path: `/uploads/${payFile.filename}`,
            size: payFile.size,
            mimetype: payFile.mimetype,
          };
        }
      }

      // Payment date will be set when admin confirms payment
      // Don't set payment_date automatically

      // Insert into Postgres
      const { rows } = await query(
        `INSERT INTO registrations (
          registration_id, event_name, event_category, event_fee,
          participant_name, participant_email, participant_phone, participant_college, participant_roll,
          college_id_filename, college_id_original_name, college_id_path, college_id_size, college_id_mimetype,
          team_size, team_name, team_captain, team_members,
          payment_status, utr_number, payment_date,
          ip_address, user_agent, payment_proof
        ) VALUES (
          $1,$2,$3,$4,
          $5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,
          $15,$16,$17,$18,
          $19,$20,$21,
          $22,$23,$24
        ) RETURNING registration_id, event_name, participant_name, participant_email, payment_status, submitted_at`,
        [
          registrationId, payload.eventName, payload.eventCategory, payload.eventFee,
          payload.participantName, payload.participantEmail, payload.participantPhone, payload.participantCollege, payload.participantRoll,
          collegeIdProof.filename, collegeIdProof.originalName, collegeIdProof.path, collegeIdProof.size, collegeIdProof.mimetype,
          payload.teamSize, payload.teamName || null, payload.teamCaptain || null, JSON.stringify(teamMembers),
          payload.paymentStatus, payload.utrNumber || null, payload.paymentDate || null,
          payload.ipAddress, payload.userAgent, payload.paymentProof ? JSON.stringify(payload.paymentProof) : null
        ]
      );

      const doc = rows[0];

      return res.status(201).json({
        success: true,
        message: 'Registration submitted successfully',
        data: {
          registrationId: doc.registration_id,
          eventName: doc.event_name,
          participantName: doc.participant_name,
          participantEmail: doc.participant_email,
          paymentStatus: doc.payment_status,
          submittedAt: doc.submitted_at,
        },
      });
    } catch (err) {
      // Handle duplicate (unique indexes) and validation errors
      if (err && (err.code === '23505' || /duplicate key/i.test(err.message))) {
        const constraint = (err.constraint || '').toLowerCase();
        if (constraint.includes('ux_utr')) {
          return res.status(409).json({ success: false, message: 'UTR already used' });
        }
        if (constraint.includes('ux_email_event')) {
          return res.status(409).json({ success: false, message: 'Duplicate registration detected for this email and event' });
        }
        return res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint' });
      }

      return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
    }
  }
);

// GET /api/registration/all
router.get('/all', async (req, res) => {
  try {
    const { category, event } = req.query;
    const filter = {};
    if (category) filter.eventCategory = category;
    if (event) filter.eventName = event;

    const clauses = [];
    const params = [];
    if (filter.eventCategory) { params.push(filter.eventCategory); clauses.push(`event_category = $${params.length}`); }
    if (filter.eventName) { params.push(filter.eventName); clauses.push(`event_name = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM registrations ${where} ORDER BY submitted_at DESC`, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch registrations', error: err.message });
  }
});

// GET /api/registration/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM registrations WHERE event_category = $1 ORDER BY submitted_at DESC`, [req.params.category]);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch registrations', error: err.message });
  }
});

// GET /api/registration/event/:event
router.get('/event/:event', async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM registrations WHERE event_name = $1 ORDER BY submitted_at DESC`, [req.params.event]);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch registrations', error: err.message });
  }
});

// GET /api/registration/:id - Get single registration by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM registrations WHERE registration_id = $1`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch registration', error: err.message });
  }
});

// GET /api/registration/utr/:utr - Check UTR availability
router.get('/utr/:utr', async (req, res) => {
  const raw = req.params.utr;
  if (!raw) {
    return res.status(400).json({ success: false, message: 'UTR is required' });
  }
  const normalized = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9]{6,50}$/.test(normalized)) {
    return res.status(400).json({ success: false, message: 'Invalid UTR format' });
  }
  try {
    const { rows } = await query('SELECT 1 FROM registrations WHERE UPPER(utr_number) = $1 LIMIT 1', [normalized]);
    return res.json({ success: true, utr: normalized, available: rows.length === 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to check UTR', error: err.message });
  }
});

module.exports = router;
