/**
 * Registration Model
 * PostgreSQL model for event registrations based on the frontend registration form
 */

const { query } = require('../db/pg');

// Registration helper functions
const Registration = {};

// Generate unique registration ID
Registration.generateRegistrationId = async () => {
    const prefix = 'ESP2026'; // Esplendidez 2026 (fixed format)
    
    // Find the latest registration
    const result = await query(
        'SELECT registration_id FROM registrations WHERE registration_id LIKE $1 ORDER BY registration_id DESC LIMIT 1',
        [prefix + '%']
    );

    let nextNumber = 1;
    if (result.rows.length > 0) {
        const currentNumber = parseInt(result.rows[0].registration_id.replace(prefix, ''));
        if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
        }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Create a new registration
Registration.create = async (data) => {
    const {
        registrationId,
        eventName,
        eventCategory,
        eventFee,
        participantName,
        participantEmail,
        participantPhone,
        participantCollege,
        participantRoll,
        collegeIdProof,
        teamSize = 1,
        teamName,
        teamCaptain,
        teamMembers = [],
        paymentStatus = 'pending',
        utrNumber,
        paymentDate,
        paymentProof,
        registrationStatus = 'active',
        ipAddress,
        userAgent,
        adminNotes
    } = data;

    const normalizedUtr = utrNumber ? String(utrNumber).trim().toUpperCase().replace(/\s+/g, '') : null;

    const result = await query(
        `INSERT INTO registrations (
            registration_id, event_name, event_category, event_fee,
            participant_name, participant_email, participant_phone, participant_college, participant_roll,
            college_id_filename, college_id_original_name, college_id_path, college_id_size, college_id_mimetype,
            team_size, team_name, team_captain, team_members,
            payment_status, utr_number, payment_date, payment_proof,
            registration_status, ip_address, user_agent, admin_notes
        ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21, $22,
            $23, $24, $25, $26
        ) RETURNING *`,
        [
            registrationId, eventName, eventCategory, eventFee,
            participantName, participantEmail, participantPhone, participantCollege, participantRoll,
            collegeIdProof.filename, collegeIdProof.originalName, collegeIdProof.path, collegeIdProof.size, collegeIdProof.mimetype,
            teamSize, teamName, teamCaptain, JSON.stringify(teamMembers),
            paymentStatus, normalizedUtr, paymentDate, paymentProof ? JSON.stringify(paymentProof) : null,
            registrationStatus, ipAddress, userAgent, adminNotes
        ]
    );

    return result.rows[0];
};

// Find registration by ID
Registration.findByRegistrationId = async (registrationId) => {
    const result = await query(
        'SELECT * FROM registrations WHERE registration_id = $1',
        [registrationId]
    );
    return result.rows[0] || null;
};

// Find registration by email and event
Registration.findByEmailAndEvent = async (email, eventName) => {
    const result = await query(
        'SELECT * FROM registrations WHERE participant_email = $1 AND event_name = $2',
        [email, eventName]
    );
    return result.rows[0] || null;
};

// Find all registrations with optional filters
Registration.findAll = async (filters = {}) => {
    let queryText = 'SELECT * FROM registrations WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.eventCategory) {
        queryText += ` AND event_category = $${paramCount}`;
        params.push(filters.eventCategory);
        paramCount++;
    }

    if (filters.paymentStatus) {
        queryText += ` AND payment_status = $${paramCount}`;
        params.push(filters.paymentStatus);
        paramCount++;
    }

    if (filters.registrationStatus) {
        queryText += ` AND registration_status = $${paramCount}`;
        params.push(filters.registrationStatus);
        paramCount++;
    }

    queryText += ' ORDER BY submitted_at DESC';

    const result = await query(queryText, params);
    return result.rows;
};

// Update registration
Registration.update = async (registrationId, updates) => {
    const allowedFields = [
        'event_name', 'event_category', 'event_fee',
        'participant_name', 'participant_email', 'participant_phone', 'participant_college', 'participant_roll',
        'team_size', 'team_name', 'team_captain', 'team_members',
        'payment_status', 'utr_number', 'payment_date', 'payment_proof',
        'registration_status', 'admin_notes'
    ];

    const setFields = [];
    const params = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            setFields.push(`${key} = $${paramCount}`);
            params.push(updates[key]);
            paramCount++;
        }
    });

    if (setFields.length === 0) {
        throw new Error('No valid fields to update');
    }

    // Always update updated_at
    setFields.push(`updated_at = NOW()`);

    params.push(registrationId);
    const queryText = `UPDATE registrations SET ${setFields.join(', ')} WHERE registration_id = $${paramCount} RETURNING *`;

    const result = await query(queryText, params);
    return result.rows[0] || null;
};

// Update payment status
Registration.updatePaymentStatus = async (registrationId, status, verifiedBy = null) => {
    const updates = { payment_status: status };
    
    if (status === 'confirmed') {
        updates.payment_date = new Date();
        if (verifiedBy) {
            updates.payment_verified_by = verifiedBy;
            updates.payment_verified_at = new Date();
        }
    }

    return await Registration.update(registrationId, updates);
};

// Delete registration
Registration.delete = async (registrationId) => {
    const result = await query(
        'DELETE FROM registrations WHERE registration_id = $1 RETURNING *',
        [registrationId]
    );
    return result.rows[0] || null;
};

// Check if registration is editable
Registration.isEditable = (registration) => {
    return registration.payment_status === 'pending' && registration.registration_status === 'active';
};

// Format registration for email
Registration.toEmailFormat = (registration) => {
    const totalTeamSize = (registration.team_members ? JSON.parse(registration.team_members).length : 0) + 1;
    
    return {
        registrationId: registration.registration_id,
        eventName: registration.event_name,
        eventCategory: registration.event_category,
        participantName: registration.participant_name,
        participantEmail: registration.participant_email,
        participantPhone: registration.participant_phone,
        participantCollege: registration.participant_college,
        teamName: registration.team_name,
        teamSize: totalTeamSize,
        eventFee: registration.event_fee,
        paymentStatus: registration.payment_status,
        submittedAt: registration.submitted_at
    };
};

// Get statistics
Registration.getStatistics = async () => {
    const totalResult = await query('SELECT COUNT(*)::int as count FROM registrations');
    const pendingResult = await query('SELECT COUNT(*)::int as count FROM registrations WHERE payment_status = $1', ['pending']);
    const revenueResult = await query('SELECT COALESCE(SUM(event_fee), 0)::numeric as total FROM registrations WHERE payment_status = $1', ['confirmed']);
    const categoryResult = await query(`
        SELECT 
            event_category as _id,
            COUNT(*)::int as count,
            COALESCE(SUM(CASE WHEN payment_status = 'confirmed' THEN event_fee ELSE 0 END), 0)::numeric as revenue
        FROM registrations
        GROUP BY event_category
    `);

    return {
        totalRegistrations: totalResult.rows[0].count,
        pendingPayments: pendingResult.rows[0].count,
        totalRevenue: revenueResult.rows[0].total,
        categoryWise: categoryResult.rows
    };
};

module.exports = Registration;
