export default function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://esplendidez.online");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Example response
  return res.status(200).json({ ok: true });
}
