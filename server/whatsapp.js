// High-performance Queue-based WhatsApp Service
// Connects to Local WhatsApp Bot Worker on laptop

let pendingMessages = [];
let lastWorkerPing = 0;

function enqueueMessage(phone, messageText) {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  
  const id = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
  pendingMessages.push({ id, phone: cleanPhone, messageText, createdAt: Date.now() });
  
  if (pendingMessages.length > 50) pendingMessages.shift();
  console.log(`[WhatsApp Queue] Enqueued message to ${cleanPhone}. Queue length: ${pendingMessages.length}`);
  return true;
}

async function sendWhatsAppMessage(phone, messageText) {
  enqueueMessage(phone, messageText);
  // Returns true if local bot worker was active in last 45 seconds
  const isWorkerOnline = (Date.now() - lastWorkerPing) < 45000;
  return isWorkerOnline;
}

function pollPendingMessages() {
  lastWorkerPing = Date.now();
  const msgs = [...pendingMessages];
  pendingMessages = []; // Drain queue
  return msgs;
}

function recordWorkerPing() {
  lastWorkerPing = Date.now();
}

function getWorkerStatus() {
  const isOnline = (Date.now() - lastWorkerPing) < 45000;
  return {
    isOnline,
    lastPingAgoSeconds: Math.round((Date.now() - lastWorkerPing) / 1000),
    queueSize: pendingMessages.length
  };
}

module.exports = {
  sendWhatsAppMessage,
  pollPendingMessages,
  recordWorkerPing,
  getWorkerStatus
};
