/**
 * Flenko 24/7 Cloud OTP Dispatcher
 * Sends real SMS / WhatsApp OTPs directly from the cloud (Render)
 * Zero laptop or local browser required.
 */

const https = require('https');

// Helper: HTTP request wrapper with timeout
async function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 8000
      };

      const req = https.request(reqOptions, (res) => {
        let responseData = '';
        res.on('data', chunk => { responseData += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve({ statusCode: res.statusCode, data: json });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: responseData });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.on('error', err => reject(err));

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Provider 1: Fast2SMS (Indian Mobile Cloud SMS - 24/7, No laptop required)
 * Free credits on signup at https://www.fast2sms.com/
 */
async function sendViaFast2SMS(phone, otp) {
  const apiKey = (process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY || '').trim();
  if (!apiKey) return null;

  try {
    console.log(`[Cloud OTP] Attempting Fast2SMS for +91${phone}...`);
    
    // Quick OTP Route via POST
    const payload = JSON.stringify({
      route: 'otp',
      variables_values: otp.toString(),
      numbers: phone.toString()
    });

    const res = await httpRequest('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    if (res.data && (res.data.return === true || res.data.status_code === 200)) {
      console.log(`[Cloud OTP] ✅ Fast2SMS sent successfully to +91${phone}:`, res.data.message || 'OK');
      return { success: true, provider: 'Fast2SMS (SMS)' };
    }

    // Fallback to GET route
    const getUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=otp&variables_values=${otp}&numbers=${phone}`;
    const getRes = await httpRequest(getUrl, { method: 'GET' });
    if (getRes.data && (getRes.data.return === true || getRes.data.status_code === 200)) {
      console.log(`[Cloud OTP] ✅ Fast2SMS GET sent successfully to +91${phone}`);
      return { success: true, provider: 'Fast2SMS (SMS)' };
    }

    console.warn('[Cloud OTP] Fast2SMS returned error:', res.data || res.raw);
    return null;
  } catch (err) {
    console.error('[Cloud OTP] Fast2SMS network error:', err.message);
    return null;
  }
}

/**
 * Provider 2: 2Factor.in (India SMS)
 */
async function sendViaTwoFactor(phone, otp) {
  const apiKey = (process.env.TWOFACTOR_API_KEY || '').trim();
  if (!apiKey) return null;

  try {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/OTP1`;
    const res = await httpRequest(url, { method: 'GET' });
    if (res.data && res.data.Status === 'Success') {
      console.log(`[Cloud OTP] ✅ 2Factor SMS sent successfully to +91${phone}`);
      return { success: true, provider: '2Factor (SMS)' };
    }
    return null;
  } catch (err) {
    console.error('[Cloud OTP] 2Factor error:', err.message);
    return null;
  }
}

/**
 * Provider 3: Twilio (Global SMS / WhatsApp)
 */
async function sendViaTwilio(phone, otp) {
  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNum = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM || '').trim();
  if (!sid || !token || !fromNum) return null;

  try {
    const formattedPhone = phone.startsWith('+') ? phone : '+91' + phone;
    const bodyParams = new URLSearchParams();
    bodyParams.append('To', formattedPhone);
    bodyParams.append('From', fromNum);
    bodyParams.append('Body', `Flenko B2B Verification Code: ${otp}. Valid for 10 minutes.`);
    const postData = bodyParams.toString();

    const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (res.data && res.data.sid) {
      console.log(`[Cloud OTP] ✅ Twilio sent successfully to ${formattedPhone}`);
      return { success: true, provider: 'Twilio' };
    }
    return null;
  } catch (err) {
    console.error('[Cloud OTP] Twilio error:', err.message);
    return null;
  }
}

/**
 * Provider 4: Meta Official WhatsApp Cloud API
 */
async function sendViaMetaWhatsApp(phone, otp) {
  const token = (process.env.WHATSAPP_CLOUD_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();
  const phoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID || '').trim();
  if (!token || !phoneId) return null;

  try {
    const fullPhone = phone.startsWith('91') ? phone : '91' + phone;
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      to: fullPhone,
      type: 'text',
      text: { body: `*Flenko.com - B2B Marketplace*\n\nYour Verification OTP is: *${otp}*\n\nPlease do not share this code with anyone.` }
    });

    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    if (res.data && res.data.messages) {
      console.log(`[Cloud OTP] ✅ Meta WhatsApp Cloud sent to ${fullPhone}`);
      return { success: true, provider: 'Meta WhatsApp Cloud' };
    }
    return null;
  } catch (err) {
    console.error('[Cloud OTP] Meta WhatsApp error:', err.message);
    return null;
  }
}

/**
 * Provider 5: UltraMsg Cloud WhatsApp Gateway
 */
async function sendViaUltraMsg(phone, otp) {
  const instanceId = (process.env.ULTRAMSG_INSTANCE_ID || '').trim();
  const token = (process.env.ULTRAMSG_TOKEN || '').trim();
  if (!instanceId || !token) return null;

  try {
    const fullPhone = phone.startsWith('91') ? phone : '91' + phone;
    const bodyParams = new URLSearchParams();
    bodyParams.append('token', token);
    bodyParams.append('to', fullPhone);
    bodyParams.append('body', `*Flenko.com - B2B Marketplace*\n\nYour Login OTP is: *${otp}*`);
    const postData = bodyParams.toString();

    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (res.data && (res.data.sent === 'true' || res.data.sent === true)) {
      console.log(`[Cloud OTP] ✅ UltraMsg WhatsApp sent to ${fullPhone}`);
      return { success: true, provider: 'UltraMsg WhatsApp' };
    }
    return null;
  } catch (err) {
    console.error('[Cloud OTP] UltraMsg error:', err.message);
    return null;
  }
}

/**
 * Master Cloud Dispatcher
 * Automatically tries all configured 24/7 cloud providers
 */
async function dispatchCloudOtp(phone, otp) {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

  // 1. Fast2SMS (Indian SMS - Fastest & zero setup)
  const f2s = await sendViaFast2SMS(cleanPhone, otp);
  if (f2s) return f2s;

  // 2. 2Factor.in
  const twoFact = await sendViaTwoFactor(cleanPhone, otp);
  if (twoFact) return twoFact;

  // 3. Twilio (Global SMS/WhatsApp)
  const twilio = await sendViaTwilio(cleanPhone, otp);
  if (twilio) return twilio;

  // 4. Meta Official WhatsApp Cloud API
  const meta = await sendViaMetaWhatsApp(cleanPhone, otp);
  if (meta) return meta;

  // 5. UltraMsg Cloud WhatsApp
  const ultra = await sendViaUltraMsg(cleanPhone, otp);
  if (ultra) return ultra;

  // 6. Transparent Cloud Server Log (Available 24/7 in Render Console)
  console.log('\n=============================================================');
  console.log(`[FLENKO CLOUD OTP] Mobile: +91${cleanPhone}`);
  console.log(`[FLENKO CLOUD OTP] 6-Digit OTP: ${otp}`);
  console.log(`[FLENKO CLOUD OTP] Status: Active in database (Valid for 10 min)`);
  console.log(`[TIP] Set FAST2SMS_API_KEY on Render for instant telecom SMS.`);
  console.log('=============================================================\n');

  return {
    success: true,
    sent: false,
    provider: 'cloud_log',
    message: 'OTP generated and saved in cloud database.'
  };
}

function getCloudConfigStatus() {
  return {
    fast2sms: Boolean(process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY),
    twofactor: Boolean(process.env.TWOFACTOR_API_KEY),
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    metaWhatsApp: Boolean((process.env.WHATSAPP_CLOUD_TOKEN || process.env.WHATSAPP_TOKEN) && (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID)),
    ultraMsg: Boolean(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN)
  };
}

module.exports = {
  dispatchCloudOtp,
  getCloudConfigStatus,
  sendViaFast2SMS,
  sendViaTwilio,
  sendViaMetaWhatsApp
};
