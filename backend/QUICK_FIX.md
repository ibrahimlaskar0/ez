# Quick Fix: Backend Not Responding

**Having POST and registration errors? Follow these steps to fix it immediately.**

---

## 🚨 Immediate Actions

### Step 1: Check if Backend is Online

Open your browser and visit:
```
https://ez-two-amber.vercel.app/api/health
```

**If you see:** ✅ `{"success":true,"message":"..."}` → Backend is working, skip to Step 4

**If you see:** ❌ Error 502/503 or "Cannot connect" → Continue to Step 2

---

### Step 2: Check Vercel Deployment

1. Go to https://vercel.com/dashboard
2. Find your project (ez or esplendidez-2026-backend)
3. Check if deployment shows "Ready" (green checkmark)

**If deployment failed:**
- Click on the failed deployment
- Check the build logs for errors
- Common issues:
  - Missing `package.json` → Make sure backend folder has it
  - Build errors → Check the error message
  - Continue to Step 3 to fix environment variables

---

### Step 3: Set Up Environment Variables (Critical!)

The most common cause is **missing environment variables**.

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these REQUIRED variables:**

#### 1. Database (Required)
```
Name: DATABASE_URL
Value: postgresql://user:password@host:5432/database?connection_limit=1
```

**Don't have a database?** Get a free one:
- **Neon** (Recommended): https://neon.tech → Copy connection string
- **Supabase**: https://supabase.com → Settings → Database → Connection String
- **Railway**: https://railway.app → New → PostgreSQL → Connection String

⚠️ **Important:** Add `?connection_limit=1` at the end of the URL for serverless

#### 2. JWT Secret (Required)
```
Name: JWT_SECRET
Value: [Generate a random 32+ character string]
```

**Generate one:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or in Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or just use this (but change it!)
your-super-secret-jwt-key-minimum-32-chars
```

#### 3. Node Environment (Required)
```
Name: NODE_ENV
Value: production
```

#### 4. File Uploads (Recommended)
```
Name: CLOUDINARY_URL
Value: cloudinary://api_key:api_secret@cloud_name
```

**Get one free:** https://cloudinary.com → Sign up → Copy "API Environment variable"

After adding variables, click **"Redeploy"** (Deployments tab → ... menu → Redeploy)

---

### Step 4: Fix CORS Errors

If backend is online but you still get errors from your frontend:

**Add your domain to CORS allowlist:**

1. Go to Vercel → Settings → Environment Variables
2. Add or update:
   ```
   Name: FRONTEND_URL
   Value: https://your-domain.com,https://your-other-domain.com
   ```
   ⚠️ **Multiple domains:** Separate with commas, no spaces

3. Redeploy

**Common domains to add:**
```
https://esplendidez.tech,https://www.esplendidez.tech,https://esplendidez.online,https://www.esplendidez.online,https://ibrahimlaskar0.github.io
```

---

### Step 5: Verify It's Working

After redeploying, test:

**Health Check:**
```bash
curl https://ez-two-amber.vercel.app/api/health
```

**From Frontend:**
1. Open your website
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Type: `console.log(window.ESPL_API_BASE)`
5. Should show: `https://ez-two-amber.vercel.app`

**Try Registration:**
1. Fill out registration form
2. Submit
3. Open DevTools → Network tab
4. Look for POST request to `/api/registration/register`
5. Check response - should NOT be CORS error or 502

---

## 📋 Full Checklist

Before going live, ensure:

- [ ] Backend deployed to Vercel
- [ ] `DATABASE_URL` set in Vercel environment variables
- [ ] Database is accessible from internet (most cloud DBs are by default)
- [ ] `JWT_SECRET` set (32+ random characters)
- [ ] `NODE_ENV=production` set
- [ ] `CLOUDINARY_URL` set for file uploads
- [ ] All frontend domains added to `FRONTEND_URL` or CORS allowlist
- [ ] Health endpoint returns 200: https://ez-two-amber.vercel.app/api/health
- [ ] Registration form submits without CORS errors
- [ ] Files upload successfully (test with image)

---

## 🔍 Still Not Working?

### Debug Steps

1. **Check Vercel Logs**
   - Go to: Deployments → Click deployment → "View Function Logs"
   - Look for specific error messages

2. **Test Endpoints Manually**
   ```bash
   # Test health
   curl https://ez-two-amber.vercel.app/api/health
   
   # Test CORS
   curl -X OPTIONS https://ez-two-amber.vercel.app/api/health \
     -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

3. **Check Frontend Console**
   - Open DevTools → Console
   - Look for error messages
   - Check what URL is being called
   - Verify `window.ESPL_API_BASE` is correct

4. **Check Network Tab**
   - Open DevTools → Network
   - Submit registration form
   - Look at the POST request
   - Check request URL, headers, response

---

## 📚 Need More Help?

- **Detailed Setup:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Environment Variables:** [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎯 Local Development Quick Start

Want to run backend locally for testing?

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your local database
# PGHOST=localhost
# PGUSER=postgres
# PGPASSWORD=postgres
# PGDATABASE=esplendidez2026

# 4. Start PostgreSQL
sudo service postgresql start

# 5. Create database
psql -U postgres -c "CREATE DATABASE esplendidez2026;"

# 6. Start server
npm start

# 7. Test
curl http://localhost:5001/api/health
```

Server will run on http://localhost:5001

---

## 💡 Quick Tips

- **Database:** Use Neon.tech for free serverless PostgreSQL
- **Files:** Use Cloudinary for free file hosting (10GB free)
- **CORS:** Add ALL your domains to avoid errors
- **JWT Secret:** Never use default in production
- **Logs:** Always check Vercel logs when something fails
- **Testing:** Test health endpoint first, then other endpoints
- **Environment:** Set environment variables for "Production", "Preview", AND "Development" scopes

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Backend crashed or not deployed | Check Vercel deployment status and logs |
| Connection refused | Wrong API URL or backend down | Verify `window.ESPL_API_BASE` is correct |
| CORS policy blocked | Domain not in allowlist | Add domain to `FRONTEND_URL` |
| password authentication failed | Wrong DATABASE_URL | Check database credentials |
| JWT verification failed | Wrong JWT_SECRET | Ensure JWT_SECRET matches everywhere |
| File upload failed | Cloudinary not configured | Set `CLOUDINARY_URL` |
| Cannot find module 'express' | Dependencies not installed | Vercel should auto-install, check build logs |

---

**Need immediate help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

---

**Last Updated:** 2026-02-03
