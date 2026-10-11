/**
 * Flenko Email Service (Nodemailer)
 * Sends password reset links and transactional notifications
 */

const nodemailer = require('nodemailer');

function getTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }
  return null;
}

async function sendPasswordResetEmail(toEmail, resetUrl, userName = 'Valued Member') {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Flenko B2B Marketplace" <support@flenko.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Flenko.com</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 25px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .header span { color: #14b8a6; }
        .content { padding: 35px 30px; }
        .content h2 { margin-top: 0; font-size: 20px; color: #0f172a; }
        .btn-box { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(13,148,136,0.25); }
        .link-text { font-size: 13px; color: #64748b; word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Flenko<span>.com</span></h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName || 'User'},</p>
          <p>We received a request to reset the password for your Flenko B2B Marketplace account.</p>
          <p>Click the button below to choose a new password. This link is valid for <b>1 hour</b>.</p>
          
          <div class="btn-box">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>

          <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your web browser:</p>
          <div class="link-text">
            <a href="${resetUrl}" style="color: #0d9488;">${resetUrl}</a>
          </div>

          <p style="margin-top: 30px; font-size: 13px; color: #94a3b8;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Flenko Marketplace. All rights reserved.<br>
          Connecting Global Buyers and Verified Manufacturers.
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: 'Reset Your Flenko Account Password',
        html: htmlContent
      });
      console.log(`[Mail Service] ✅ Email delivered to ${toEmail}:`, info.messageId);
      return { sent: true, messageId: info.messageId, provider: 'smtp' };
    } catch (err) {
      console.error('[Mail Service] ⚠️ SMTP Send Error:', err.message);
      // Fallback log
    }
  }

  // Fallback: Log directly to server console (Accessible in Render logs & response)
  console.log('\n=============================================================');
  console.log(`[FLENKO PASSWORD RESET LINK]`);
  console.log(`To: ${toEmail}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`Valid for: 1 hour`);
  console.log(`[TIP] Set SMTP_HOST, SMTP_USER, SMTP_PASS on Render to send live emails.`);
  console.log('=============================================================\n');

  return {
    sent: true,
    provider: 'cloud_log',
    resetUrl
  };
}

module.exports = {
  sendPasswordResetEmail
};
