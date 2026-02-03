import { applyCors } from "../_cors";

/**
 * Event Registration API Endpoint (Vercel Serverless Function)
 * 
 * This is a Vercel-compatible serverless API endpoint for event registration.
 * It handles cross-origin requests from multiple frontend domains and validates
 * participant registration data.
 * 
 * CORS Configuration:
 * - Supports dynamic Access-Control-Allow-Origin from approved domains
 * - Allowed origins include:
 *   • Production: esplendidez.online, esplendidez.tech, ibrahimlaskar0.github.io
 *   • Vercel: ez-two-amber.vercel.app, es-two-amber.vercel.app
 *   • Development: localhost:3000, localhost:3001, localhost:5500, localhost:5002
 * - Handles OPTIONS preflight requests
 * - Returns appropriate CORS headers for all responses
 * 
 * Supported Methods:
 * - OPTIONS: Preflight check (handled by applyCors)
 * - POST: Submit registration data
 * 
 * Request Body (JSON):
 * - eventName: string (required) - Name of the event
 * - participantName: string (required) - Full name of participant
 * - participantEmail: string (required) - Valid email address
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "Registration submitted successfully",
 *   "registrationId": "ESP1234567890",
 *   "data": { ...submitted data }
 * }
 * 
 * Error Responses:
 * - 400: Invalid JSON, missing required fields, or validation errors
 * - 405: Method not allowed (only POST supported)
 * 
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  // Apply CORS headers for all allowed origins
  // This handles OPTIONS preflight and sets Access-Control-Allow-Origin dynamically
  if (!applyCors(req, res)) return;

  // Only POST method is allowed for registration
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false,
      message: "Method not allowed. Please use POST to submit registration." 
    });
  }

  // Parse request body (handle both string and object formats)
  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid JSON format in request body. Please check your data and try again." 
    });
  }

  // Validate required fields and provide specific error messages
  const missingFields = [];
  
  if (!data || typeof data !== "object") {
    return res.status(400).json({ 
      success: false,
      message: "Request body must be a valid JSON object." 
    });
  }

  if (!data.eventName || typeof data.eventName !== "string" || !data.eventName.trim()) {
    missingFields.push("eventName");
  }
  
  if (!data.participantName || typeof data.participantName !== "string" || !data.participantName.trim()) {
    missingFields.push("participantName");
  }
  
  if (!data.participantEmail || typeof data.participantEmail !== "string" || !data.participantEmail.trim()) {
    missingFields.push("participantEmail");
  }

  // Return clear validation error if any required field is missing
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}. Please provide all required information.`,
      missingFields
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.participantEmail.trim())) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid email format. Please provide a valid email address." 
    });
  }

  // Generate registration ID (timestamp-based for demo purposes)
  // In production, this should come from database auto-increment or UUID
  const registrationId = `ESP${Date.now()}`;

  // Return success response with clear message
  return res.status(201).json({
    success: true,
    message: "Registration submitted successfully! You will receive a confirmation email shortly.",
    registrationId,
    data: {
      eventName: data.eventName.trim(),
      participantName: data.participantName.trim(),
      participantEmail: data.participantEmail.trim().toLowerCase()
    }
  });
}
