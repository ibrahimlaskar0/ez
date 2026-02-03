/**
 * Admin Model
 * PostgreSQL model for admin users who can access the admin dashboard
 */

const bcrypt = require('bcryptjs');
const { query } = require('../db/pg');

// Admin helper functions
const Admin = {};

// Find admin by email
Admin.findByEmail = async (email) => {
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    return result.rows[0] || null;
};

// Find admin by ID
Admin.findById = async (id) => {
    const result = await query('SELECT * FROM admins WHERE id = $1', [id]);
    return result.rows[0] || null;
};

// Check if admin is locked
Admin.isLocked = (admin) => {
    return !!(admin.lock_until && new Date(admin.lock_until) > new Date());
};

// Hash password
Admin.hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
};

// Compare password
Admin.comparePassword = async (candidatePassword, hashedPassword) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Increment login attempts
Admin.incLoginAttempts = async (adminId) => {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error('Admin not found');

    // If we have a previous lock that has expired, restart at 1
    if (admin.lock_until && new Date(admin.lock_until) < new Date()) {
        await query(
            'UPDATE admins SET login_attempts = 1, lock_until = NULL WHERE id = $1',
            [adminId]
        );
        return;
    }

    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes
    const newAttempts = (admin.login_attempts || 0) + 1;

    if (newAttempts >= maxAttempts && !Admin.isLocked(admin)) {
        await query(
            'UPDATE admins SET login_attempts = $1, lock_until = $2 WHERE id = $3',
            [newAttempts, new Date(Date.now() + lockTime), adminId]
        );
    } else {
        await query(
            'UPDATE admins SET login_attempts = $1 WHERE id = $2',
            [newAttempts, adminId]
        );
    }
};

// Reset login attempts
Admin.resetLoginAttempts = async (adminId) => {
    await query(
        'UPDATE admins SET login_attempts = 0, lock_until = NULL WHERE id = $1',
        [adminId]
    );
};

// Update last login
Admin.updateLastLogin = async (adminId, ipAddress) => {
    await query(
        'UPDATE admins SET last_login = NOW(), last_activity = NOW(), last_login_ip = $1 WHERE id = $2',
        [ipAddress, adminId]
    );
};

// Check if admin has specific permission
Admin.hasPermission = (admin, permission) => {
    if (admin.role === 'super_admin') return true;
    const permissions = admin.permissions || [];
    return permissions.includes(permission);
};

// Get default permissions based on role
Admin.getDefaultPermissions = (role) => {
    const permissionSets = {
        'super_admin': [
            'view_registrations', 'edit_registrations', 'delete_registrations',
            'verify_payments', 'export_data', 'manage_admins', 'view_statistics', 'send_emails'
        ],
        'admin': [
            'view_registrations', 'edit_registrations', 'verify_payments',
            'export_data', 'view_statistics', 'send_emails'
        ],
        'moderator': [
            'view_registrations', 'verify_payments', 'view_statistics'
        ]
    };
    return permissionSets[role] || [];
};

// Create default admin
Admin.createDefaultAdmin = async () => {
    try {
        // Check if any super admin exists
        const result = await query('SELECT * FROM admins WHERE role = $1 LIMIT 1', ['super_admin']);
        if (result.rows.length > 0) {
            console.log('🔑 Super admin already exists');
            return result.rows[0];
        }

        const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@esplendidez2026.com';
        const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2026';
        const hashedPassword = await Admin.hashPassword(password);
        const permissions = JSON.stringify(Admin.getDefaultPermissions('super_admin'));

        const insertResult = await query(
            `INSERT INTO admins (name, email, password, role, permissions, is_active, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            ['Super Admin', email, hashedPassword, 'super_admin', permissions, true, true]
        );

        console.log('🔑 Default super admin created successfully');
        console.log(`📧 Email: ${email}`);
        console.log('🔒 Please change the default password after first login');

        return insertResult.rows[0];
    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
        throw error;
    }
};

// Get admin statistics
Admin.getStatistics = async () => {
    const totalResult = await query('SELECT COUNT(*)::int as count FROM admins');
    const activeResult = await query('SELECT COUNT(*)::int as count FROM admins WHERE is_active = true');
    const roleResult = await query('SELECT role, COUNT(*)::int as count FROM admins GROUP BY role');
    const recentLoginsResult = await query(
        'SELECT COUNT(*)::int as count FROM admins WHERE last_login >= NOW() - INTERVAL \'7 days\''
    );

    const roleDistribution = {};
    roleResult.rows.forEach(row => {
        roleDistribution[row.role] = row.count;
    });

    return {
        totalAdmins: totalResult.rows[0].count,
        activeAdmins: activeResult.rows[0].count,
        roleDistribution,
        recentLogins: recentLoginsResult.rows[0].count
    };
};

// Transform admin object to remove sensitive fields
Admin.toJSON = (admin) => {
    if (!admin) return null;
    const { password, password_reset_token, login_attempts, lock_until, ...rest } = admin;
    return rest;
};

module.exports = Admin;
