/**
 * Esplendidez 2026 Backend Server
 * Local server entry point
 * Imports the Express app from app.js and starts the HTTP server
 */

require('dotenv').config();

// Import the Express app
const app = require('./app');

// Start server only when run directly (not when imported by tests)
const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`🚀 Esplendidez 2026 Backend Server running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
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