/**
 * Runtime API Configuration
 * 
 * This file sets the global API base URL (window.ESPL_API_BASE) based on the deployment environment.
 * All API calls throughout the application should use this base URL.
 * 
 * DEPLOYMENT SCENARIOS:
 * 
 * 1. Local Development:
 *    - Frontend: http://localhost:3000 (or any port)
 *    - Backend: http://localhost:5001
 *    - Sets: window.ESPL_API_BASE = 'http://localhost:5001'
 * 
 * 2. Production (GitHub Pages, Netlify, or custom domains):
 *    - Frontend: https://esplendidez.tech, https://ibrahimlaskar0.github.io, etc.
 *    - Backend: https://ez-two-amber.vercel.app (deployed on Vercel)
 *    - Sets: window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'
 * 
 * 3. Production Vercel Frontend (if frontend also on Vercel):
 *    - Frontend: https://es-two-amber.vercel.app
 *    - Backend: https://ez-two-amber.vercel.app
 *    - Sets: window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'
 * 
 * IMPORTANT:
 * - DO NOT use relative API URLs (like /api/...) unless both FE and BE run together
 * - This file must load BEFORE any other scripts that make API calls
 * - Add <script src="js/runtime-config.js"></script> in HTML head
 */

// Automatically detect environment and set API base URL
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development - point to local backend
  window.ESPL_API_BASE = 'http://localhost:5001';
  console.log('🔧 Development Mode: Using local backend');
} else if (window.location.hostname.includes('github.io') || 
           window.location.hostname.includes('esplendidez.tech') ||
           window.location.hostname.includes('esplendidez.online') ||
           window.location.hostname.includes('netlify.app') ||
           window.location.hostname.includes('vercel.app')) {
  // Production - point to Vercel backend
  window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app';
  console.log('🌐 Production Mode: Using Vercel backend');
} else {
  // Fallback - Vercel backend
  window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app';
  console.log('🌐 Fallback Mode: Using Vercel backend');
}

console.log('🌐 API Base URL:', window.ESPL_API_BASE);
