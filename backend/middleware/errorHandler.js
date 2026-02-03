/**
 * Error Handling Middleware
 * Centralized error handling for the Express application
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error to console (in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Error:', err);
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        let message = 'Duplicate value entered';
        
        // Extract field name from error message
        if (err.detail) {
            if (err.detail.includes('email')) {
                message = 'Email address is already registered';
            } else if (err.detail.includes('registration_id')) {
                message = 'Registration ID already exists';
            } else if (err.detail.includes('utr_number')) {
                message = 'UTR number is already used';
            } else if (err.constraint) {
                message = `Duplicate entry for ${err.constraint}`;
            }
        }
        
        error = { message, statusCode: 400 };
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        const message = 'Referenced record does not exist';
        error = { message, statusCode: 400 };
    }

    // PostgreSQL invalid input syntax
    if (err.code === '22P02' || err.code === '23502') {
        const message = 'Invalid input format';
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large. Maximum size is 5MB';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        const message = 'Too many files uploaded';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field';
        error = { message, statusCode: 400 };
    }

    // Default server error
    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Don't expose sensitive error details in production
    const response = {
        success: false,
        error: message
    };

    // Add additional error details in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = err;
    }

    // Add error code for client handling
    if (statusCode !== 500) {
        response.code = err.code || 'VALIDATION_ERROR';
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;