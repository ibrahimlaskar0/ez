import { applyCors } from "./_cors";

/**
 * Health check endpoint for Vercel serverless deployment
 * Used to verify backend API availability
 */
export default function handler(req, res) {
  // Apply CORS headers for all allowed origins
  if (!applyCors(req, res)) return;

  // Example response
  return res.status(200).json({ ok: true });
}
