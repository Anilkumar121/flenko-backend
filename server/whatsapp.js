// Lightweight WhatsApp module for Shared Hosting
// Full Puppeteer / WhatsApp-Web requires a dedicated VPS server.
// On cPanel, simulated mode provides instant startup and safe operation.

console.log('Flenko WhatsApp Service: Running in Simulated Mode for cPanel.');

async function sendWhatsAppMessage(phone, messageText) {
  console.log(`[WhatsApp Message to ${phone}]:\n${messageText}`);
  // Returning false triggers the built-in fallback in app.js,
  // which delivers the OTP directly on the user's screen (_devOtp).
  return false;
}

function getLatestQR() {
  return null;
}

module.exports = { sendWhatsAppMessage, getLatestQR };
