# Backend Troubleshooting Guide

## Issue: "Backend not responding" or "POST and registration errors"

This guide helps resolve common backend deployment and connectivity issues.

---

## Quick Diagnosis

### 1. Check if Backend is Running

```bash
# Test health endpoint
curl https://ez-two-amber.vercel.app/api/health

# Expected response (if working):
# {"success":true,"message":"Esplendidez 2026 Backend Server is running",...}

# If you get Connection Refused or 502/503 errors → Backend is down
# If you get CORS errors → CORS misconfiguration
# If you get 404 → Routing issue
```

### 2. Check Frontend Console

Open browser DevTools → Console:
```javascript
// Check what API base URL is being used
console.log(window.ESPL_API_BASE);

// Should be: https://ez-two-amber.vercel.app (production)
// Or: http://localhost:5001 (local development)
```

### 3. Check Network Tab

In DevTools → Network:
- Look for failed requests to `/api/registration/register`
- Check the request URL (should be full URL to Vercel backend)
- Check response status code and error message
- Verify CORS headers are present

---

## Common Issues & Solutions

### Issue 1: Backend Returns 502/503 or Connection Refused

**Cause:** Backend is not deployed or crashed

**Solutions:**

1. **Check Vercel Deployment Status**
   - Go to Vercel dashboard: https://vercel.com
   - Check deployment logs for errors
   - Look for build failures or runtime errors

2. **Verify Environment Variables on Vercel**
   Required environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

   To add/update:
   - Go to Vercel project settings
   - Navigate to Environment Variables
   - Add missing variables
   - Redeploy the project

3. **Check Database Connection**
   - Ensure PostgreSQL database is accessible from Vercel
   - Verify DATABASE_URL is correct
   - Check if database accepts connections from Vercel IPs
   - For cloud databases (like Neon, Supabase), ensure no IP restrictions

4. **Review Deployment Logs**
   ```bash
   # Using Vercel CLI
   vercel logs
   
   # Look for errors like:
   # - "password authentication failed"
   # - "ECONNREFUSED"
   # - "MODULE_NOT_FOUND"
   ```

### Issue 2: CORS Errors

**Cause:** Frontend origin not in CORS allowlist

**Error Message:** 
```
Access to fetch at 'https://ez-two-amber.vercel.app/api/...' from origin 'https://your-domain.com' 
has been blocked by CORS policy
```

**Solutions:**

1. **Add Origin to Backend CORS Configuration**
   
   Edit `backend/server.js`:
   ```javascript
   const prodOrigins = [
     // ... existing origins
     'https://your-new-domain.com',  // Add your domain here
   ];
   ```

2. **For Serverless Functions**
   
   Edit `backend/api/_cors.js`:
   ```javascript
   const allowedOrigins = [
     // ... existing origins
     "https://your-new-domain.com",  // Add your domain here
   ];
   ```

3. **Deploy Changes**
   ```bash
   git add .
   git commit -m "Add new origin to CORS allowlist"
   git push
   # Vercel will auto-deploy
   ```

### Issue 3: Database Connection Failed

**Error in logs:** `password authentication failed for user "postgres"`

**Solutions:**

1. **Verify DATABASE_URL Format**
   ```
   postgresql://username:password@host:port/database
   
   Example:
   postgresql://postgres:mypassword@db.example.com:5432/esplendidez2026
   ```

2. **Use Environment-Specific Connection**
   
   For Vercel, use a cloud PostgreSQL provider:
   - [Neon](https://neon.tech) - Serverless Postgres
   - [Supabase](https://supabase.com) - PostgreSQL with extras
   - [Railway](https://railway.app) - PostgreSQL hosting
   - [ElephantSQL](https://www.elephantsql.com) - PostgreSQL as a service

3. **Connection Pooling for Serverless**
   
   Edit `.env` on Vercel:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/db?connection_limit=1
   ```

### Issue 4: File Upload Errors

**Error:** `Failed to process college ID proof file`

**Cause:** Local file storage doesn't work on Vercel serverless

**Solutions:**

1. **Configure Cloudinary for File Storage**
   
   Add to Vercel environment variables:
   ```
   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
   ```
   
   Or individually:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

2. **Backend Auto-Detects Cloudinary**
   
   The backend automatically uses Cloudinary when `CLOUDINARY_URL` is set:
   ```javascript
   const hasCloudinary = !!process.env.CLOUDINARY_URL;
   ```

### Issue 5: Registration Form Not Submitting

**Symptoms:** Form submits but nothing happens, or shows offline mode

**Solutions:**

1. **Check API Base URL Configuration**
   
   Verify `js/runtime-config.js` is loaded first:
   ```html
   <head>
     <!-- MUST load before other scripts -->
     <script src="js/runtime-config.js"></script>
     <script src="js/api.js"></script>
     <script src="js/registration-form.js"></script>
   </head>
   ```

2. **Verify Full URL is Used**
   
   In `js/registration-form.js`, ensure:
   ```javascript
   const apiBase = window.ESPL_API_BASE || 'https://ez-two-amber.vercel.app';
   const apiUrl = `${apiBase}/api/registration/register`;
   // NOT: const apiUrl = '/api/registration/register'; ❌
   ```

3. **Check Browser Console for Errors**
   - Open DevTools → Console
   - Look for fetch errors or CORS errors
   - Check what URL is being called

### Issue 6: Missing Dependencies

**Error:** `Cannot find module 'express'` or similar

**Cause:** Dependencies not installed

**Solutions:**

1. **Local Development**
   ```bash
   cd backend
   npm install
   ```

2. **Vercel Deployment**
   - Vercel auto-installs dependencies during build
   - If failing, check `package.json` is in backend directory
   - Check build logs for npm install errors

---

## Local Development Setup

To run backend locally:

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

3. **Start PostgreSQL**
   ```bash
   # Using Docker
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
   
   # Or using system service
   sudo service postgresql start
   ```

4. **Create Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE esplendidez2026;"
   ```

5. **Start Backend**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

6. **Test Health Endpoint**
   ```bash
   curl http://localhost:5001/api/health
   ```

---

## Vercel Deployment Checklist

Before deploying to Vercel, ensure:

- [ ] `vercel.json` exists with proper configuration
- [ ] `package.json` has all required dependencies
- [ ] Database is set up and accessible from internet
- [ ] Environment variables are configured in Vercel dashboard:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `CLOUDINARY_URL` (if using file uploads)
  - [ ] `FRONTEND_URL` (comma-separated list of allowed origins)
- [ ] CORS origins include all frontend domains
- [ ] `.gitignore` excludes `.env`, `node_modules`, etc.

To deploy:
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd backend
vercel --prod
```

---

## Testing Backend Manually

### Test Health Check
```bash
curl https://ez-two-amber.vercel.app/api/health
```

### Test CORS
```bash
curl -X OPTIONS https://ez-two-amber.vercel.app/api/health \
  -H "Origin: https://esplendidez.tech" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Test Registration (expects validation error)
```bash
curl -X POST https://ez-two-amber.vercel.app/api/registration/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://esplendidez.tech" \
  -d '{"test": "data"}' \
  -v
```

---

## Getting Help

If issues persist:

1. **Check Logs**
   - Vercel dashboard → Deployments → Click deployment → View Function Logs
   - Look for specific error messages

2. **Test with Curl**
   - Use curl commands above to isolate frontend vs backend issues

3. **Verify Configuration**
   - Double-check all environment variables
   - Ensure database is accessible
   - Confirm CORS origins are correct

4. **Contact Support**
   - Include error messages from:
     - Browser console
     - Network tab
     - Vercel deployment logs
   - Provide steps to reproduce the issue

---

## Quick Reference

### Required Files
- `backend/server.js` - Express app
- `backend/api/index.js` - Vercel serverless wrapper
- `backend/routes/registration.js` - Registration routes
- `backend/db/pg.js` - Database connection
- `backend/vercel.json` - Vercel configuration
- `backend/.env` - Environment variables (not in git)
- `backend/package.json` - Dependencies

### Required Environment Variables
```env
# Production (Vercel)
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
CLOUDINARY_URL=cloudinary://...
FRONTEND_URL=https://esplendidez.tech,https://esplendidez.online

# Development (Local)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=esplendidez2026
NODE_ENV=development
PORT=5001
```

### Important URLs
- Backend Health: https://ez-two-amber.vercel.app/api/health
- Registration API: https://ez-two-amber.vercel.app/api/registration/register
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/ibrahimlaskar0/ez

---

**Last Updated:** 2026-02-03
