# API Connection Guide - Frontend to Backend

## Overview

This document explains how the Esplendidez 2026 frontend connects to the backend API across different deployment environments. The setup ensures reliable API communication for registration, admin features, and all other API endpoints.

---

## Architecture

### Frontend Deployments
- **Production**: 
  - https://esplendidez.online (primary domain)
  - https://esplendidez.tech (alternative domain)
  - https://ibrahimlaskar0.github.io (GitHub Pages)
  - https://esplendidez-2026-frontend.netlify.app (Netlify)
  - https://es-two-amber.vercel.app (Vercel frontend, if used)

- **Development**:
  - http://localhost:3000 (or any port like 3001, 5500, 5002, etc.)
  - http://127.0.0.1:3000
  - Local network IPs (192.168.x.x)

### Backend Deployment
- **Production**: https://ez-two-amber.vercel.app (Vercel serverless)
- **Development**: http://localhost:5001 (Express server)

---

## How It Works

### 1. Runtime Configuration (`js/runtime-config.js`)

This file **MUST** load before any other JavaScript that makes API calls. It sets the global `window.ESPL_API_BASE` variable.

```html
<!-- In HTML <head> section -->
<script src="js/runtime-config.js"></script>
<script src="js/api.js"></script>
<script src="js/registration-form.js"></script>
```

**Logic:**
- Detects `localhost` or `127.0.0.1` → sets `window.ESPL_API_BASE = 'http://localhost:5001'`
- Detects production domains → sets `window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'`
- Fallback → sets `window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'`

### 2. API Service (`js/api.js`)

All API calls use the `ApiService` class which:
1. Reads `window.ESPL_API_BASE` from runtime-config.js
2. Appends `/api` to form the complete API base URL
3. Makes all requests to the full URL (never relative paths)

**Example:**
```javascript
// ✅ CORRECT - Full URL from window.ESPL_API_BASE
const apiBase = window.ESPL_API_BASE || 'https://ez-two-amber.vercel.app';
const apiUrl = `${apiBase}/api/registration/register`;
fetch(apiUrl, {...})

// ❌ WRONG - Relative URL (only works if FE and BE on same domain)
fetch('/api/registration/register', {...})
```

### 3. Registration Form (`js/registration-form.js`)

The registration form uses the full API base URL:

```javascript
const apiBase = window.ESPL_API_BASE || 'https://ez-two-amber.vercel.app';
const apiUrl = `${apiBase}/api/registration/register`;
const res = await fetch(apiUrl, { method: 'POST', body: formData });
```

### 4. Error Handling & Fallback

If the backend is unreachable:
1. Show meaningful error message: "Unable to reach registration server. Please check your internet connection."
2. Fall back to localStorage for offline functionality
3. Log the error for debugging

---

## Backend CORS Configuration

### Express Server (`backend/server.js`)

CORS middleware allows requests from:
- **Production**: esplendidez.tech, esplendidez.online, ibrahimlaskar0.github.io, Netlify, Vercel
- **Development**: localhost (all ports), 127.0.0.1 (all ports), local network IPs

```javascript
const prodOrigins = [
  'https://esplendidez.tech',
  'https://www.esplendidez.tech',
  'https://esplendidez.online',
  'https://www.esplendidez.online',
  'https://ibrahimlaskar0.github.io',
  'https://ez-two-amber.vercel.app',
  'https://es-two-amber.vercel.app',
  'https://esplendidez-2026-frontend.netlify.app'
];
```

### Vercel Serverless Functions (`backend/api/_cors.js`)

For Vercel deployment, each serverless function uses `applyCors()`:

```javascript
import { applyCors } from "./_cors";

export default function handler(req, res) {
  if (!applyCors(req, res)) return;
  // ... rest of handler
}
```

**Allowed Origins:**
- All production domains
- All development localhost/127.0.0.1 ports
- Local network IPs (192.168.x.x) for development

---

## Deployment Scenarios

### Scenario 1: Local Development
```
Frontend: http://localhost:3000
Backend: http://localhost:5001

✅ window.ESPL_API_BASE = 'http://localhost:5001'
✅ API calls go to: http://localhost:5001/api/*
✅ CORS allows localhost origins
```

### Scenario 2: Production (GitHub Pages + Vercel Backend)
```
Frontend: https://ibrahimlaskar0.github.io/ez
Backend: https://ez-two-amber.vercel.app

✅ window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'
✅ API calls go to: https://ez-two-amber.vercel.app/api/*
✅ CORS allows ibrahimlaskar0.github.io
```

### Scenario 3: Production (Custom Domain + Vercel Backend)
```
Frontend: https://esplendidez.tech
Backend: https://ez-two-amber.vercel.app

✅ window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'
✅ API calls go to: https://ez-two-amber.vercel.app/api/*
✅ CORS allows esplendidez.tech
```

### Scenario 4: Netlify with Proxy (Optional)
```
Frontend: https://esplendidez-2026-frontend.netlify.app
Netlify Proxy: /api/* → https://ez-two-amber.vercel.app/api/*

⚠️  With netlify.toml proxy: relative URLs work
✅ With direct calls: window.ESPL_API_BASE still works
```

---

## Troubleshooting

### Error: "Failed to fetch" or "CORS policy blocked"

**Causes:**
1. Backend is down or unreachable
2. CORS origin not in allowlist
3. Using relative URL instead of full URL

**Solutions:**
1. Check backend is running: Visit https://ez-two-amber.vercel.app/api/health
2. Add your domain to CORS allowlist in `backend/api/_cors.js` and `backend/server.js`
3. Ensure `runtime-config.js` is loaded first
4. Check browser console for `window.ESPL_API_BASE` value
5. Verify API calls use full URL, not relative paths

### Error: "Registration failed"

**Debugging Steps:**
1. Open browser DevTools → Network tab
2. Check the request URL - should be full URL to Vercel backend
3. Check request method (POST) and Content-Type
4. Check response status code and error message
5. Verify CORS headers in response

### Testing CORS

Use curl or browser:
```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://ez-two-amber.vercel.app/api/health \
  -H "Origin: https://esplendidez.tech" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test GET with origin
curl https://ez-two-amber.vercel.app/api/health \
  -H "Origin: https://esplendidez.tech" \
  -v
```

Look for these headers in response:
- `Access-Control-Allow-Origin: https://esplendidez.tech`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token`

---

## Adding New Frontend Domains

If you deploy to a new domain, update these files:

1. **Backend Express** (`backend/server.js`):
   ```javascript
   prodOrigins.push('https://your-new-domain.com');
   ```

2. **Backend Vercel Functions** (`backend/api/_cors.js`):
   ```javascript
   const allowedOrigins = [
     // ... existing origins
     "https://your-new-domain.com"
   ];
   ```

3. **Runtime Config** (`js/runtime-config.js`):
   ```javascript
   else if (window.location.hostname.includes('your-new-domain.com')) {
     window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app';
   }
   ```

4. **Deploy** both frontend and backend for changes to take effect.

---

## API Endpoints

All endpoints are prefixed with `/api`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/registration/register` | POST | Register for event |
| `/api/registration/all` | GET | Get all registrations |
| `/api/registration/category/:cat` | GET | Get registrations by category |
| `/api/auth/admin/login` | POST | Admin login |
| `/api/admin/payment-status` | PATCH | Update payment status |
| `/api/payment/verify` | POST | Verify payment |

---

## Environment Variables

### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://...

# Frontend URLs (comma-separated, optional)
FRONTEND_URL=https://esplendidez.tech,https://esplendidez.online

# Uploads
UPLOAD_DIR=/tmp/uploads

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend

No environment variables needed. Configuration is in `runtime-config.js`.

---

## Best Practices

1. **Always use full API URLs** - Never use relative paths unless both FE and BE are on the same domain
2. **Load runtime-config.js first** - Before any other scripts
3. **Check CORS allowlist** - Add all your frontend domains
4. **Use meaningful error messages** - Help users understand connectivity issues
5. **Test OPTIONS requests** - Ensure preflight CORS requests work
6. **Monitor backend health** - Use `/api/health` endpoint
7. **Log API base URL** - Check console for `window.ESPL_API_BASE` on page load

---

## Files Modified

### Frontend
- `js/runtime-config.js` - Sets API base URL based on environment
- `js/api.js` - API service with proper base URL resolution
- `js/registration-form.js` - Uses full API URL for registration

### Backend
- `backend/server.js` - Express CORS configuration
- `backend/api/_cors.js` - Vercel serverless CORS helper
- `backend/api/registration/register.js` - Registration handler with CORS
- `backend/api/health.js` - Health check with CORS

---

## Support

For issues or questions:
1. Check browser console for errors and `window.ESPL_API_BASE` value
2. Verify backend is running: https://ez-two-amber.vercel.app/api/health
3. Test CORS with curl or browser DevTools
4. Review this guide for troubleshooting steps

---

**Last Updated:** 2026-02-03
**Version:** 1.0
