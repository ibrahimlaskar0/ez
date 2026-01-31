/**
 * Esplendidez 2026 Backend Server
 * Main server file for the tech fest event management system
 * 
 * Features:
 * - Event registration management
 * - Payment processing
 * - Admin dashboard
 * - File uploads for ID verification
 * - Email notifications
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import PostgreSQL schema initializer
const { ensureSchema } = require('./db/pg');

// Import routes
const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Initialize PostgreSQL schema (skip during tests)
if (process.env.NODE_ENV !== 'test') {
    ensureSchema().catch((e) => console.error('DB schema init failed', e));
}

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const prodOrigins = [];
if (process.env.FRONTEND_URL) {
    // Allow comma-separated list of origins in FRONTEND_URL
    process.env.FRONTEND_URL.split(',').forEach((o) => {
        const v = String(o).trim();
        if (v) prodOrigins.push(v);
    });
}
// Production domains
prodOrigins.push('https://esplendidez.tech');
prodOrigins.push('https://www.esplendidez.tech');
prodOrigins.push('https://esplendidez.online');
prodOrigins.push('https://www.esplendidez.online');
prodOrigins.push('https://ibrahimlaskar0.github.io');
// Netlify site (fallback if env not set)
prodOrigins.push('https://esplendidez-2026-frontend.netlify.app');

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? prodOrigins
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://localhost:3001',
            'http://localhost:5002',
            'http://127.0.0.1:5002',
            'http://192.168.1.5:3000',   // Current network IP
            'http://192.168.1.8:3000',
            'http://192.168.4.48:3000',
            'http://192.168.4.48:3001',
            'http://192.168.4.48:5500',
            /^http:\/\/192\.168\.1\.\d+:3000$/,  // Allow any IP in 192.168.1.x range
            /^http:\/\/192\.168\.4\.\d+:3000$/   // Allow any IP in 192.168.4.x range
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting - more permissive for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for dev
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
});

app.use('/api/auth', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded documents (support serverless /tmp on Vercel)
const isVercel = !!process.env.VERCEL;
const UPLOAD_DIR = process.env.UPLOAD_DIR || (isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads'));
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { /* directory may already exist */ }
app.use('/uploads', express.static(UPLOAD_DIR));

// Root endpoint (useful on platforms hitting "/")
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Esplendidez 2026 Backend API',
        health: '/api/health'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Esplendidez 2026 Backend Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server only when run directly (not when imported by tests)
const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`🚀 Esplendidez 2026 Backend Server running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('📴 SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('💤 Process terminated');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('📴 SIGINT received. Shutting down gracefully...');
        server.close(() => {
            console.log('💤 Process terminated');
            process.exit(0);
        });
    });
}

module.exports = app;