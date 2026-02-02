import { applyCors } from "../_cors";

export default async function handler(req, res) {
  // Allow CORS from your frontend domain
  res.setHeader("Access-Control-Allow-Origin", "https://esplendidez.online");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  let data;

  try {
    data = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;
  } catch {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  // Validate required fields (example: add checks for all your required fields)
  if (!data || !data.eventName || !data.participantName || !data.participantEmail) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Here you can add DB logic, etc. For now, return a sample registrationId
  const registrationId = `ESP${Date.now()}`;

  res.status(201).json({
    success: true,
    registrationId,
    data
  });
}
