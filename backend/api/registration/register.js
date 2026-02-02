export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }
  // Example validation
  const { participantEmail, participantPhone, participantName } = req.body || {};

  // Basic validation as per your backend requirements
  if (!participantEmail || !participantPhone || !participantName) {
    res.status(400).json({
      success: false,
      message: 'All fields are required (email, phone, name)',
    });
    return;
  }
  // Simulate registration ID
  const registrationId = 'REG_' + Date.now();

  res.status(201).json({
    success: true,
    registrationId,
    message: 'Registration successful',
  });
}
