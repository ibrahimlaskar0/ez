/**
 * CORS Configuration for Vercel Serverless Functions
 * 
 * This module provides CORS headers for all API endpoints deployed on Vercel.
 * It allows requests from all valid frontend origins (production and development).
 * 
 * Allowed Origins:
 * - Production: esplendidez.online, esplendidez.tech, ibrahimlaskar0.github.io
 * - Vercel deployments: ez-two-amber.vercel.app, es-two-amber.vercel.app
 * - Netlify: esplendidez-2026-frontend.netlify.app
 * - Development: localhost (all ports), 127.0.0.1 (all ports)
 */
export function applyCors(req, res) {
  const allowedOrigins = [
    // Production domains
    "https://esplendidez.online",
    "https://www.esplendidez.online",
    "https://esplendidez.tech",
    "https://www.esplendidez.tech",
    "https://ibrahimlaskar0.github.io",
    // Vercel frontend deployments
    "https://ez-two-amber.vercel.app",
    "https://es-two-amber.vercel.app",
    // Netlify deployments
    "https://esplendidez-2026-frontend.netlify.app",
    // Development origins
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5500",
    "http://localhost:5002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5002"
  ];

  const origin = req.headers.origin;

  // Allow requests from allowed origins or local network IPs for development
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (origin && origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/)) {
    // Allow any localhost or local network IP during development
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Preflight request
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false; // stop handler
  }

  return true; // continue handler
}
