export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://esplendidez.online");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Actual response
  res.status(200).json({ status: "ok" });
}
