export function applyCors(req, res) {
  const allowedOrigins = [
    "https://esplendidez.online",
    "https://esplendidez.tech"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight request
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false; // stop handler
  }

  return true; // continue handler
}
