/**
 * PostgreSQL Database Connection Configuration
 * Handles connection to PostgreSQL with error handling
 */

const { pool } = require('../db/pg');

const connectDB = async () => {
    try {
        // Test the PostgreSQL connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();

        console.log(`🐘 PostgreSQL Connected`);
        console.log(`📊 Database: ${process.env.PGDATABASE || 'esplendidez2026'}`);
        console.log(`🕐 Server Time: ${result.rows[0].now}`);

        return pool;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        // Exit process with failure if in production
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        
        // In development, retry connection after delay
        console.log('🔄 Retrying database connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// Function to check database health
const checkDatabaseHealth = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        return {
            status: 'connected',
            connected: true,
            host: process.env.PGHOST || 'localhost',
            database: process.env.PGDATABASE || 'esplendidez2026'
        };
    } catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error.message
        };
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('🔌 PostgreSQL connection pool closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error closing PostgreSQL connection:', err);
        process.exit(1);
    }
});

module.exports = connectDB;
module.exports.checkDatabaseHealth = checkDatabaseHealth;
