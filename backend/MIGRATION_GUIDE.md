# MongoDB to PostgreSQL Migration Guide

This guide will help you migrate from MongoDB to PostgreSQL.

## Prerequisites

1. **Install PostgreSQL** on your system:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Use default port 5432

2. **Create Database**:
   ```sql
   -- Open psql or pgAdmin and run:
   CREATE DATABASE esplendidez2026;
   ```

## Configuration Steps

### 1. Update Environment Variables

Edit `backend/.env` file:

```env
# PostgreSQL Configuration
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=esplendidez2026
```

Or use connection string format:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/esplendidez2026
```

### 2. Initialize Database Schema

The schema is automatically created when you start the server. It includes:
- `admins` table - For admin users
- `registrations` table - For event registrations

### 3. Create Default Admin

The default admin is automatically created on first run:
- Email: `admin@esplendidez2026.com` (or from ADMIN_DEFAULT_EMAIL)
- Password: `changeThisPassword123!` (or from ADMIN_DEFAULT_PASSWORD)

**Important**: Change the default password after first login!

### 4. Start the Server

```bash
cd backend
npm start
```

The server will:
1. Connect to PostgreSQL
2. Create tables if they don't exist
3. Create default admin if needed

## Changes Made

### Dependencies
- ✅ Removed: `mongoose`
- ✅ Added: `pg` (PostgreSQL driver)

### Database Configuration
- ✅ `config/database.js` - Now uses PostgreSQL connection pool
- ✅ `.env` - Updated with PostgreSQL connection variables

### Models
- ✅ `models/Admin.js` - Converted to PostgreSQL functions
- ✅ `models/Registration.js` - Converted to PostgreSQL functions

### Database Schema
- ✅ `db/pg.js` - PostgreSQL schema with admin and registration tables

### Routes
- ✅ All routes already use PostgreSQL (they were already updated in your codebase)

## Data Migration (Optional)

If you have existing MongoDB data to migrate:

### Export from MongoDB
```bash
mongoexport --uri="your_mongodb_uri" --collection=registrations --out=registrations.json
mongoexport --uri="your_mongodb_uri" --collection=admins --out=admins.json
```

### Import to PostgreSQL
You'll need to write a custom migration script to transform and import the JSON data. Contact your developer for assistance.

## Testing

1. **Test Database Connection**:
   ```bash
   cd backend
   node -e "require('./db/pg').ensureSchema().then(() => console.log('Schema OK'))"
   ```

2. **Test Server**:
   ```bash
   npm start
   ```
   
   Visit: http://localhost:5001/api/health

3. **Test Registration**:
   - Open your registration form
   - Submit a test registration
   - Check PostgreSQL: `SELECT * FROM registrations;`

## Rollback (If Needed)

To rollback to MongoDB:
1. Restore `package.json` from git history
2. Run `npm install`
3. Restore `.env` with MONGODB_URI
4. Restore old model files from git history

## Troubleshooting

### Connection Errors
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -l`

### Permission Errors
- Ensure PostgreSQL user has proper permissions:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE esplendidez2026 TO postgres;
  ```

### Schema Issues
- Drop and recreate tables if schema changed:
  ```sql
  DROP TABLE registrations CASCADE;
  DROP TABLE admins CASCADE;
  ```
  Then restart the server to recreate them.

## Support

For issues, check:
1. PostgreSQL logs
2. Server console output
3. `.env` configuration
