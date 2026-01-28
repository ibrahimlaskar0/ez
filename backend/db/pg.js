const { Pool } = require('pg');

const getPool = () => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool(
    connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST || 'localhost',
          port: Number(process.env.PGPORT || 5432),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || '',
          database: process.env.PGDATABASE || 'esplendidez2026',
        }
  );
  return pool;
};

const pool = getPool();

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      permissions JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      last_login TIMESTAMPTZ,
      login_attempts INTEGER DEFAULT 0,
      lock_until TIMESTAMPTZ,
      password_reset_token TEXT,
      password_reset_expires TIMESTAMPTZ,
      created_by INTEGER REFERENCES admins(id),
      last_activity TIMESTAMPTZ DEFAULT now(),
      last_login_ip TEXT,
      registration_ip TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
    CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
    CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      registration_id TEXT UNIQUE NOT NULL,
      event_name TEXT NOT NULL,
      event_category TEXT NOT NULL,
      event_fee NUMERIC NOT NULL,
      participant_name TEXT NOT NULL,
      participant_email TEXT NOT NULL,
      participant_phone TEXT NOT NULL,
      participant_college TEXT NOT NULL,
      participant_roll TEXT NOT NULL,
      college_id_filename TEXT NOT NULL,
      college_id_original_name TEXT NOT NULL,
      college_id_path TEXT NOT NULL,
      college_id_size INTEGER NOT NULL,
      college_id_mimetype TEXT NOT NULL,
      team_size INTEGER DEFAULT 1,
      team_name TEXT,
      team_captain TEXT,
      team_members JSONB DEFAULT '[]'::jsonb,
      payment_status TEXT DEFAULT 'pending',
      utr_number TEXT,
      payment_date TIMESTAMPTZ,
      payment_proof JSONB,
      payment_verified_by INTEGER REFERENCES admins(id),
      payment_verified_at TIMESTAMPTZ,
      registration_status TEXT DEFAULT 'active',
      submitted_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      ip_address TEXT,
      user_agent TEXT,
      admin_notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_regs_event_category ON registrations(event_category);
    CREATE INDEX IF NOT EXISTS idx_regs_payment_status ON registrations(payment_status);
    CREATE INDEX IF NOT EXISTS idx_regs_registration_id ON registrations(registration_id);
    CREATE INDEX IF NOT EXISTS idx_regs_participant_email ON registrations(participant_email);
    CREATE INDEX IF NOT EXISTS idx_regs_submitted_at ON registrations(submitted_at);
    CREATE UNIQUE INDEX IF NOT EXISTS ux_email_event ON registrations(participant_email, event_name);
    -- Enforce unique UTR values (case-insensitive) when provided
    CREATE UNIQUE INDEX IF NOT EXISTS ux_utr ON registrations (UPPER(utr_number)) WHERE utr_number IS NOT NULL;
  `);
}

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

module.exports = { pool, query, ensureSchema };
