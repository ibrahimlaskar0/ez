// Runtime API base - automatically detect environment
// Use localhost for local development, Vercel backend for production
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development
  window.ESPL_API_BASE = 'http://localhost:5001';
} else if (window.location.hostname.includes('github.io') || window.location.hostname.includes('esplendidez.tech')) {
  // Production on GitHub Pages - point to Vercel backend
  window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app';
} else {
  // Fallback - Vercel backend
  window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app';
}

console.log('🌐 API Base URL:', window.ESPL_API_BASE);
