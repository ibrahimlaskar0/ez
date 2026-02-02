import { applyCors } from "../_cors";

export default async function handler(req, res) {
  if (!applyCors(req, res)) return;

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

  if (!data || !data.name || !data.event) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const registrationId = `ESP${Date.now()}`;

  res.status(201).json({
    success: true,
    registrationId,
    data
  });
}
