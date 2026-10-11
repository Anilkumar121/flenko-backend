const { Client, LocalAuth } = require('whatsapp-web.js');
let qrcodeLib = null;
try {
  qrcodeLib = require('qrcode');
} catch(e) {}

let isReady = false;
let latestQRDataUrl = null;
let client = null;

try {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'flenko-system' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log('WHATSAPP QR CODE GENERATED');
    try {
      if (qrcodeLib) {
        latestQRDataUrl = await qrcodeLib.toDataURL(qr);
      }
    } catch (err) {
      console.error('Error generating QR Data URL', err);
    }
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp Web Client is ready to send OTPs!');
    isReady = true;
    latestQRDataUrl = 'READY';
  });

  client.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated successfully.');
    latestQRDataUrl = 'READY';
  });

  client.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure', msg);
    isReady = false;
    latestQRDataUrl = null;
  });

  client.on('disconnected', (reason) => {
    console.warn('WhatsApp disconnected:', reason);
    isReady = false;
    latestQRDataUrl = null;
  });

  client.initialize().catch(err => {
    console.error('WhatsApp initialization error:', err.message);
  });
} catch (err) {
  console.error('WhatsApp client setup error:', err.message);
}

async function sendWhatsAppMessage(phone, messageText) {
  if (!client || !isReady) {
    console.warn(`WhatsApp client not ready yet. Simulating MSG to ${phone}:\n${messageText}`);
    return false;
  }
  
  try {
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    const chatId = formattedPhone + '@c.us';
    
    await client.sendMessage(chatId, messageText);
    console.log(`✅ WhatsApp MSG sent to ${phone}`);
    return true;
  } catch (err) {
    console.error('Failed to send WhatsApp MSG:', err);
    return false;
  }
}

function getLatestQR() {
  return latestQRDataUrl;
}

module.exports = { sendWhatsAppMessage, getLatestQR };
