# Deployment Guide: Vercel Backend Setup

This guide explains how to deploy the Esplendidez 2026 backend to Vercel with proper configuration.

---

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **PostgreSQL Database**: Cloud-hosted database accessible from internet
   - Recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)
3. **Cloudinary Account** (for file uploads): Sign up at https://cloudinary.com
4. **GitHub Repository**: Connected to Vercel for auto-deployment

---

## Step 1: Set Up Cloud Database

### Option A: Neon (Recommended for Serverless)

1. Go to https://neon.tech and create account
2. Create a new project: "esplendidez2026"
3. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb
   ```
4. The database schema will be automatically created on first connection

### Option B: Supabase

1. Go to https://supabase.com and create account
2. Create a new project: "esplendidez2026"
3. Go to Settings → Database → Connection String
4. Copy "Connection string" in URI format
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Option C: Railway

1. Go to https://railway.app and create account
2. Create new project → Add PostgreSQL
3. Copy the connection string from the Connect tab

### Important: Database Connection for Serverless

Add connection pooling parameter to DATABASE_URL:
```
postgresql://user:pass@host:5432/db?connection_limit=1
```

This prevents "too many connections" errors in serverless environments.

---

## Step 2: Set Up Cloudinary (File Uploads)

1. Go to https://cloudinary.com and create account
2. From Dashboard, copy your credentials:
   - Cloud Name
   - API Key
   - API Secret
3. Construct the Cloudinary URL:
   ```
   cloudinary://API_KEY:API_SECRET@CLOUD_NAME
   ```

Example:
```
cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@mycloud
```

---

## Step 3: Deploy to Vercel

### Initial Setup

1. **Install Vercel CLI** (optional, but recommended)
   ```bash
   npm install -g vercel
   ```

2. **Connect GitHub Repository to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `backend` directory as the root directory
   - Click "Deploy"

### Configure Root Directory

In Vercel project settings:
1. Go to Settings → General
2. Set "Root Directory" to `backend`
3. Save changes

---

## Step 4: Configure Environment Variables

### Required Environment Variables

Go to Vercel project → Settings → Environment Variables

Add the following variables:

#### 1. Database Configuration
```
Variable Name: DATABASE_URL
Value: postgresql://user:password@host:5432/database?connection_limit=1
Environment: Production, Preview, Development
```

#### 2. JWT Secret
```
Variable Name: JWT_SECRET
Value: your-random-secret-key-at-least-32-characters-long
Environment: Production, Preview, Development
```

⚠️ **Generate a secure random key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. Node Environment
```
Variable Name: NODE_ENV
Value: production
Environment: Production
```

#### 4. JWT Expiration
```
Variable Name: JWT_EXPIRE
Value: 7d
Environment: Production, Preview, Development
```

#### 5. Admin Credentials
```
Variable Name: ADMIN_DEFAULT_EMAIL
Value: admin@esplendidez2026.com
Environment: Production, Preview, Development

Variable Name: ADMIN_DEFAULT_PASSWORD
Value: YourSecureAdminPassword123!
Environment: Production, Preview, Development
```

#### 6. Cloudinary Configuration
```
Variable Name: CLOUDINARY_URL
Value: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
Environment: Production, Preview, Development
```

Or separately:
```
Variable Name: CLOUDINARY_CLOUD_NAME
Value: your-cloud-name
Environment: Production, Preview, Development

Variable Name: CLOUDINARY_API_KEY
Value: 123456789012345
Environment: Production, Preview, Development

Variable Name: CLOUDINARY_API_SECRET
Value: your-api-secret
Environment: Production, Preview, Development
```

#### 7. Frontend URLs (CORS)
```
Variable Name: FRONTEND_URL
Value: https://esplendidez.tech,https://esplendidez.online,https://ibrahimlaskar0.github.io
Environment: Production, Preview, Development
```

⚠️ **Add all your frontend domains, separated by commas, no spaces**

#### 8. Email Configuration (Optional)
```
Variable Name: EMAIL_SERVICE
Value: gmail
Environment: Production

Variable Name: EMAIL_HOST
Value: smtp.gmail.com
Environment: Production

Variable Name: EMAIL_PORT
Value: 587
Environment: Production

Variable Name: EMAIL_USER
Value: your-email@gmail.com
Environment: Production

Variable Name: EMAIL_PASSWORD
Value: your-app-specific-password
Environment: Production

Variable Name: EMAIL_FROM
Value: "Esplendidez 2026" <noreply@esplendidez2026.com>
Environment: Production
```

---

## Step 5: Redeploy

After adding environment variables:

1. Go to Deployments tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache" → No
5. Click "Redeploy"

Or using CLI:
```bash
vercel --prod
```

---

## Step 6: Verify Deployment

### Test Health Endpoint
```bash
curl https://your-vercel-url.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Esplendidez 2026 Backend Server is running",
  "timestamp": "2026-02-03T10:00:00.000Z",
  "uptime": 123.456
}
```

### Test CORS
```bash
curl -X OPTIONS https://your-vercel-url.vercel.app/api/health \
  -H "Origin: https://esplendidez.tech" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Look for these headers:
```
Access-Control-Allow-Origin: https://esplendidez.tech
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Credentials: true
```

### Test Registration Endpoint
```bash
curl -X POST https://your-vercel-url.vercel.app/api/registration/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://esplendidez.tech" \
  -d '{"test": "data"}' \
  -v
```

Should return 400 with validation error (this is expected - it means endpoint is working).

---

## Step 7: Update Frontend Configuration

In your frontend repository, update `js/runtime-config.js`:

```javascript
// Update this line with your actual Vercel URL
const DEFAULT_API_BASE = 'https://your-vercel-url.vercel.app';
```

Or keep using:
```javascript
const DEFAULT_API_BASE = 'https://ez-two-amber.vercel.app';
```

---

## Troubleshooting Deployment

### Issue: "Connection to database failed"

**Check:**
1. DATABASE_URL is correct and includes `?connection_limit=1`
2. Database allows connections from Vercel IPs (most cloud DBs allow all by default)
3. Database credentials are correct
4. Database exists and is accessible

**View Logs:**
```bash
vercel logs
```

### Issue: "MODULE_NOT_FOUND"

**Solution:**
1. Ensure `package.json` is in the backend directory
2. Redeploy without build cache
3. Check Vercel build logs for npm install errors

### Issue: "502 Bad Gateway"

**Possible Causes:**
1. Function timeout (default 10s on free plan)
2. Unhandled error in code
3. Database connection timeout

**Solutions:**
1. Check function logs in Vercel dashboard
2. Upgrade to Pro plan for longer timeout
3. Optimize database queries

### Issue: CORS errors from frontend

**Solution:**
Add frontend domain to CORS allowlist:

1. Update `FRONTEND_URL` environment variable
2. Or edit `backend/server.js` and `backend/api/_cors.js`
3. Redeploy

---

## Environment Variables Quick Reference

### Required (Minimum to Function)
```env
DATABASE_URL=postgresql://...?connection_limit=1
JWT_SECRET=minimum-32-character-random-string
NODE_ENV=production
```

### Recommended (Full Functionality)
```env
DATABASE_URL=postgresql://...?connection_limit=1
JWT_SECRET=secure-random-key
JWT_EXPIRE=7d
NODE_ENV=production
CLOUDINARY_URL=cloudinary://key:secret@cloudname
FRONTEND_URL=https://domain1.com,https://domain2.com
ADMIN_DEFAULT_EMAIL=admin@example.com
ADMIN_DEFAULT_PASSWORD=secure-password
```

### Optional (Email Notifications)
```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password
EMAIL_FROM="Your App" <noreply@example.com>
```

---

## Production Checklist

Before going live:

- [ ] Database is set up and accessible
- [ ] All required environment variables are configured in Vercel
- [ ] JWT_SECRET is strong and random (not default)
- [ ] ADMIN_DEFAULT_PASSWORD is changed from default
- [ ] Cloudinary is configured for file uploads
- [ ] All frontend domains are in FRONTEND_URL or CORS allowlist
- [ ] Health endpoint returns 200 OK
- [ ] CORS works from all frontend domains
- [ ] Registration endpoint accepts valid data
- [ ] File uploads work (test with image)
- [ ] Admin login works
- [ ] Database schema is created (automatic on first run)
- [ ] Deployment logs show no errors
- [ ] Test registration from production frontend

---

## Maintenance

### Update Environment Variables

1. Go to Vercel project → Settings → Environment Variables
2. Edit the variable
3. Save changes
4. Redeploy for changes to take effect

### View Logs

**Vercel Dashboard:**
1. Go to project → Deployments
2. Click on a deployment
3. Click "View Function Logs"

**Vercel CLI:**
```bash
vercel logs [deployment-url]
```

### Roll Back Deployment

1. Go to Deployments tab
2. Find a working deployment
3. Click "..." menu → "Promote to Production"

---

## Security Best Practices

1. **Never commit `.env` to git** - it's in `.gitignore`
2. **Use strong JWT_SECRET** - minimum 32 random characters
3. **Change default admin password** - after first login
4. **Use HTTPS only** - Vercel provides this automatically
5. **Rotate secrets regularly** - especially if compromised
6. **Monitor logs** - for suspicious activity
7. **Keep dependencies updated** - run `npm audit` and update packages

---

## Support

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
2. Review Vercel deployment logs for errors
3. Test endpoints manually with curl
4. Verify environment variables are set correctly

---

## Useful Links

- **Vercel Documentation:** https://vercel.com/docs
- **Neon Documentation:** https://neon.tech/docs/introduction
- **Cloudinary Documentation:** https://cloudinary.com/documentation
- **Backend Repository:** https://github.com/ibrahimlaskar0/ez

---

**Last Updated:** 2026-02-03
