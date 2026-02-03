/**
 * Models Index
 * Exports all models for use in routes
 */

const AdminModelFactory = require('./Admin');
const Registration = require('./Registration');

// Note: Admin model requires Sequelize instance
// For now, export Registration (raw PostgreSQL) 
// Admin model needs to be initialized with Sequelize elsewhere

module.exports = {
  Registration,
  // Admin will be initialized elsewhere with Sequelize
};

