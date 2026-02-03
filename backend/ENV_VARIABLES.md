# Environment Variables Configuration

This file documents all environment variables required for the backend to function properly.

---

## Quick Start

For local development:
```bash
cp .env.example .env
# Edit .env with your values
```

For production (Vercel):
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions
- All variables must be added in Vercel dashboard → Settings → Environment Variables

---

## Required Variables

These MUST be set for the backend to work:

### `DATABASE_URL`
- **Description:** PostgreSQL connection string
- **Format:** `postgresql://user:password@host:port/database?connection_limit=1`
- **Local Example:** `postgresql://postgres:postgres@localhost:5432/esplendidez2026`
- **Production Example:** `postgresql://user:pass@host.neon.tech/db?connection_limit=1`
- **Important:** Add `?connection_limit=1` for serverless environments

### `JWT_SECRET`
- **Description:** Secret key for JWT token signing
- **Format:** String (minimum 32 characters recommended)
- **Local Example:** `dev-secret-key-for-local-testing-only`
- **Production Example:** Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Security:** NEVER use default in production, NEVER commit to git

### `NODE_ENV`
- **Description:** Environment mode
- **Values:** `development` | `production` | `test`
- **Local:** `development`
- **Production:** `production`
- **Effect:** Changes CORS behavior, rate limiting, logging

---

## Recommended Variables

These should be set for full functionality:

### `JWT_EXPIRE`
- **Description:** JWT token expiration time
- **Format:** Time string (e.g., `7d`, `24h`, `1y`)
- **Default:** `7d`
- **Example:** `7d` (7 days)

### `PORT`
- **Description:** Port for local Express server
- **Format:** Number
- **Default:** `5000`
- **Local Example:** `5001`
- **Production:** Not used (Vercel handles this)

### `CLOUDINARY_URL`
- **Description:** Cloudinary connection string for file uploads
- **Format:** `cloudinary://api_key:api_secret@cloud_name`
- **Example:** `cloudinary://123456:abc123@mycloud`
- **Get from:** https://cloudinary.com/console
- **Alternative:** Set individual variables below

### `CLOUDINARY_CLOUD_NAME`
- **Description:** Cloudinary cloud name
- **Example:** `mycloud`
- **Used if:** `CLOUDINARY_URL` not set

### `CLOUDINARY_API_KEY`
- **Description:** Cloudinary API key
- **Example:** `123456789012345`
- **Used if:** `CLOUDINARY_URL` not set

### `CLOUDINARY_API_SECRET`
- **Description:** Cloudinary API secret
- **Example:** `abc123xyz789`
- **Used if:** `CLOUDINARY_URL` not set

### `FRONTEND_URL`
- **Description:** Comma-separated list of allowed frontend origins for CORS
- **Format:** `https://domain1.com,https://domain2.com,https://domain3.com`
- **Local Example:** `http://localhost:3000,http://localhost:5500`
- **Production Example:** `https://esplendidez.tech,https://esplendidez.online,https://ibrahimlaskar0.github.io`
- **Note:** No spaces between URLs

### `ADMIN_DEFAULT_EMAIL`
- **Description:** Default admin email for initial setup
- **Format:** Valid email address
- **Example:** `admin@esplendidez2026.com`
- **Used:** When creating first admin user

### `ADMIN_DEFAULT_PASSWORD`
- **Description:** Default admin password for initial setup
- **Format:** Strong password (min 8 chars, mix of letters/numbers/symbols)
- **Example:** `Admin123!SecurePassword`
- **Security:** Change after first login, never use weak passwords

---

## Optional Variables

These enhance functionality but are not required:

### Email Configuration (for notifications)

### `EMAIL_SERVICE`
- **Description:** Email service provider
- **Example:** `gmail`
- **Supported:** Any nodemailer-supported service

### `EMAIL_HOST`
- **Description:** SMTP host
- **Example:** `smtp.gmail.com`

### `EMAIL_PORT`
- **Description:** SMTP port
- **Example:** `587` (TLS) or `465` (SSL)
- **Common:** `587`

### `EMAIL_USER`
- **Description:** Email account username
- **Example:** `your-email@gmail.com`

### `EMAIL_PASSWORD`
- **Description:** Email account password or app-specific password
- **Example:** `your-app-specific-password`
- **Gmail:** Generate at https://myaccount.google.com/apppasswords

### `EMAIL_FROM`
- **Description:** Sender name and email for outgoing emails
- **Format:** `"Display Name" <email@domain.com>`
- **Example:** `"Esplendidez 2026" <noreply@esplendidez2026.com>`

---

## Development-Only Variables

These are only used in local development:

### `PGHOST`
- **Description:** PostgreSQL host
- **Default:** `localhost`
- **Example:** `localhost` or `127.0.0.1`
- **Production:** Use `DATABASE_URL` instead

### `PGPORT`
- **Description:** PostgreSQL port
- **Default:** `5432`
- **Example:** `5432`
- **Production:** Use `DATABASE_URL` instead

### `PGUSER`
- **Description:** PostgreSQL username
- **Default:** `postgres`
- **Example:** `postgres`
- **Production:** Use `DATABASE_URL` instead

### `PGPASSWORD`
- **Description:** PostgreSQL password
- **Default:** None
- **Example:** `postgres`
- **Production:** Use `DATABASE_URL` instead

### `PGDATABASE`
- **Description:** PostgreSQL database name
- **Default:** `esplendidez2026`
- **Example:** `esplendidez2026`
- **Production:** Use `DATABASE_URL` instead

### `UPLOAD_DIR`
- **Description:** Local directory for file uploads
- **Default:** `./uploads` or `/tmp/uploads` (on Vercel)
- **Example:** `/tmp/uploads`
- **Production:** Use Cloudinary instead

---

## Rate Limiting Variables

These control API rate limiting:

### `RATE_LIMIT_WINDOW`
- **Description:** Time window for rate limiting (milliseconds)
- **Default:** `900000` (15 minutes)
- **Example:** `900000`

### `RATE_LIMIT_MAX`
- **Description:** Max requests per window
- **Default:** `100` (production), `1000` (development)
- **Example:** `100`

### `AUTH_RATE_LIMIT_MAX`
- **Description:** Max authentication attempts per window
- **Default:** `5`
- **Example:** `5`

---

## Security Variables

### `BCRYPT_SALT_ROUNDS`
- **Description:** Number of salt rounds for password hashing
- **Default:** `12`
- **Example:** `12`
- **Note:** Higher = more secure but slower (10-12 recommended)

---

## File Upload Variables

### `MAX_FILE_SIZE`
- **Description:** Maximum file upload size in bytes
- **Default:** `5242880` (5 MB)
- **Example:** `5242880`
- **Note:** Backend enforces 4.5 MB limit due to multipart parsing

---

## Environment-Specific Configurations

### Local Development
```env
NODE_ENV=development
PORT=5001
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=esplendidez2026
JWT_SECRET=local-dev-secret-only
FRONTEND_URL=http://localhost:3000,http://localhost:5500
```

### Production (Vercel)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=1
JWT_SECRET=secure-32-char-random-string
JWT_EXPIRE=7d
CLOUDINARY_URL=cloudinary://key:secret@cloud
FRONTEND_URL=https://esplendidez.tech,https://esplendidez.online
ADMIN_DEFAULT_EMAIL=admin@esplendidez2026.com
ADMIN_DEFAULT_PASSWORD=SecurePassword123!
```

---

## Validation

The backend validates required variables on startup. If missing, you'll see errors like:

```
DB schema init failed: password authentication failed
```
→ Check `DATABASE_URL` or PostgreSQL credentials

```
Error: JWT_SECRET is not defined
```
→ Set `JWT_SECRET` environment variable

---

## Security Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Use strong JWT_SECRET in production**
   - Minimum 32 characters
   - Random, not predictable
   - Generate: `openssl rand -base64 32`

3. **Change default admin password immediately**
   - After first login
   - Use strong password

4. **Rotate secrets regularly**
   - Especially if compromised
   - Update in Vercel dashboard

5. **Use environment-specific values**
   - Different DATABASE_URL for dev/prod
   - Different JWT_SECRET for dev/prod
   - Never use production credentials locally

6. **Enable 2FA for Vercel account**
   - Protects environment variables
   - Prevents unauthorized access

7. **Use Vercel environment scopes**
   - Production only for sensitive values
   - Preview/Development for testing

---

## Troubleshooting

### Problem: "Cannot connect to database"
- Check `DATABASE_URL` format is correct
- Verify database is accessible (not behind firewall)
- For serverless, add `?connection_limit=1`
- Test connection manually with psql or database client

### Problem: "JWT verification failed"
- Ensure `JWT_SECRET` is the same everywhere
- Check it's set in Vercel for production
- Don't change JWT_SECRET without invalidating old tokens

### Problem: "File upload failed"
- Check `CLOUDINARY_URL` is set correctly
- Verify Cloudinary credentials are valid
- Test Cloudinary connection separately

### Problem: "CORS error"
- Add frontend domain to `FRONTEND_URL`
- Or update `backend/server.js` and `backend/api/_cors.js`
- Redeploy after changes

---

## Getting Environment Variables

### Local Development
```bash
# Check what's loaded
node -e 'require("dotenv").config(); console.log(process.env.DATABASE_URL)'
```

### Production (Vercel)
```bash
# List all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

---

## Adding New Environment Variables

1. **Add to `.env.example`** with description and example
2. **Document in this file** with purpose and format
3. **Update DEPLOYMENT_GUIDE.md** if needed for production
4. **Add validation** in code if required
5. **Update Vercel** dashboard if in production

---

## References

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Vercel environment variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Cloudinary setup](https://cloudinary.com/documentation/node_integration)
- [PostgreSQL connection strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

**Last Updated:** 2026-02-03
