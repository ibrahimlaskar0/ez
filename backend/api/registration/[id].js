import { applyCors } from "../_cors";

export default function handler(req, res) {
  if (!applyCors(req, res)) return;

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Registration ID required" });
  }

  // MOCK DATA (replace with DB later)
  res.status(200).json({
    success: true,
    registration: {
      id,
      name: "Test User",
      event: "Esplendidez 2026",
      fee: 499,
      status: "PAID"
    }
  });
}
