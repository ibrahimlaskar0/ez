// Runtime API base - automatically detect environment
// Use localhost for local development, Render backend for production
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development
  window.ESPL_API_BASE = 'http://localhost:5000';
} else if (window.location.hostname.includes('netlify')) {
  // Production on Netlify - point to Render backend
  window.ESPL_API_BASE = 'https://esplendidez-backend.onrender.com'; // Update this URL after deploying
} else {
  // Fallback
  window.ESPL_API_BASE = 'http://localhost:5000';
}

console.log('🌐 API Base URL:', window.ESPL_API_BASE);
