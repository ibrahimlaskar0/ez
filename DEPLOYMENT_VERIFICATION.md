# Deployment Verification Checklist

After deploying the changes, verify the following:

## ✅ Frontend Verification

### 1. Configuration Check
Open browser console on your deployed frontend and verify:
```javascript
console.log(window.ESPL_API_BASE);
// Should show: https://ez-two-amber.vercel.app (for production)
// Or: http://localhost:5001 (for local dev)
```

### 2. Test Page
Navigate to: `https://your-domain.com/test-api-connection.html`

Run all tests:
- ✓ Health Check - Should pass with status 200
- ✓ CORS Preflight - Should pass with status 204
- ✓ Registration Endpoint - Should pass with validation error (expected)

### 3. Registration Form
1. Go to the registration page
2. Fill out the form
3. Submit
4. Check browser Network tab:
   - Request URL should be: `https://ez-two-amber.vercel.app/api/registration/register`
   - Method: POST
   - Status: 201 (success) or 400 (validation error)
   - Response headers should include:
     - `Access-Control-Allow-Origin: https://your-domain.com`
     - `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`

### 4. Error Handling
1. Turn off backend (or block network)
2. Try to register
3. Should see error: "Server error: Failed to connect to registration server..."

---

## ✅ Backend Verification

### 1. Health Check
```bash
curl https://ez-two-amber.vercel.app/api/health
# Should return: {"success":true,"message":"...","timestamp":"...","uptime":...}
```

### 2. CORS Test
```bash
# Test from your production domain
curl -X OPTIONS https://ez-two-amber.vercel.app/api/health \
  -H "Origin: https://esplendidez.tech" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Check for these headers in response:
# Access-Control-Allow-Origin: https://esplendidez.tech
# Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token
```

### 3. Registration Endpoint
```bash
# Test with minimal data (should get validation error)
curl -X POST https://ez-two-amber.vercel.app/api/registration/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://esplendidez.tech" \
  -d '{}' \
  -v

# Should return 400 with validation error message
# Should include CORS headers
```

---

## ✅ Cross-Origin Tests

Test from each frontend domain:

1. **https://esplendidez.tech**
   - [ ] Health check works
   - [ ] Registration form works
   - [ ] CORS headers present

2. **https://esplendidez.online**
   - [ ] Health check works
   - [ ] Registration form works
   - [ ] CORS headers present

3. **https://ibrahimlaskar0.github.io/ez**
   - [ ] Health check works
   - [ ] Registration form works
   - [ ] CORS headers present

4. **https://esplendidez-2026-frontend.netlify.app**
   - [ ] Health check works
   - [ ] Registration form works
   - [ ] CORS headers present

---

## ✅ Development Environment

Test locally:

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm start
   # Should run on http://localhost:5001
   ```

2. **Start Frontend:**
   ```bash
   # Use any static server
   python3 -m http.server 3000
   # Or: npx serve -l 3000
   ```

3. **Open:** http://localhost:3000/test-api-connection.html

4. **Verify:**
   - [ ] `window.ESPL_API_BASE` = `http://localhost:5001`
   - [ ] Health check works
   - [ ] Registration form works
   - [ ] No CORS errors in console

---

## 🚨 Troubleshooting

### Issue: CORS Policy Error
**Symptoms:** "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solutions:**
1. Check if your domain is in the CORS allowlist:
   - Backend: `backend/api/_cors.js` allowedOrigins array
   - Backend: `backend/server.js` prodOrigins array
2. Verify response includes CORS headers (use browser DevTools Network tab)
3. For new domains, add them to both files and redeploy backend

### Issue: Failed to Fetch
**Symptoms:** "Server error: Failed to connect to registration server..."

**Solutions:**
1. Check `window.ESPL_API_BASE` in console - should be set correctly
2. Verify backend is running: Visit https://ez-two-amber.vercel.app/api/health
3. Check if using relative URLs (should use full URLs)
4. Verify `runtime-config.js` is loaded before other scripts
5. Check browser Network tab for actual request URL

### Issue: 404 Not Found
**Symptoms:** API returns 404 error

**Solutions:**
1. Verify endpoint path is correct: `/api/registration/register`
2. Check if backend deployment is successful
3. Verify Vercel routes are configured correctly

### Issue: OPTIONS Request Fails
**Symptoms:** Preflight OPTIONS request returns error

**Solutions:**
1. Ensure all endpoints handle OPTIONS method
2. Check CORS headers are set for OPTIONS responses
3. Verify `applyCors()` is called in all API handlers

---

## 📊 Success Criteria

All items should be ✅:

- [ ] All frontend domains can access backend APIs
- [ ] CORS headers present in all API responses
- [ ] Registration form submits successfully
- [ ] Health check endpoint returns 200
- [ ] Test page shows all tests passing
- [ ] No CORS errors in browser console
- [ ] Error messages are clear and helpful
- [ ] Local development works correctly
- [ ] All backend tests pass (16/16)
- [ ] CodeQL security scan passes (0 alerts)

---

## 📝 Monitoring

After deployment, monitor for:

1. **Error Rates:** Check for increase in API errors
2. **CORS Errors:** Monitor browser console errors
3. **Failed Registrations:** Track registration success rate
4. **Performance:** Measure API response times

Tools:
- Browser DevTools Console (CORS errors)
- Browser DevTools Network (API calls)
- Backend logs (Vercel dashboard)
- Error tracking (Sentry, LogRocket, etc.)

---

**Last Updated:** 2026-02-03
**Status:** Ready for deployment verification
