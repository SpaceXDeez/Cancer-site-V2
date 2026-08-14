const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const t = getTransporter();
  if (!t) {
    // No SMTP configured — log link so dev/staging can still test the flow
    console.log(`[PASSWORD RESET] No SMTP configured. Link for ${toEmail}:\n  ${resetUrl}`);
    return;
  }
  const from = process.env.SMTP_FROM || 'Bell Guide <noreply@bell-guide.com>';
  await t.sendMail({
    from,
    to: toEmail,
    subject: 'Reset your Bell Guide password',
    text: [
      'You requested a password reset for your Bell Guide account.',
      '',
      'Click the link below to set a new password. This link expires in 1 hour.',
      '',
      resetUrl,
      '',
      "If you didn't request this, you can safely ignore this email.",
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8;margin-top:0">Reset your password</h2>
        <p style="color:#374151">You requested a password reset for your <strong>Bell Guide</strong> account.</p>
        <p style="color:#374151">Click the button below to set a new password.
           This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                  padding:12px 28px;border-radius:8px;font-weight:600;margin:16px 0;font-size:15px">
          Reset password
        </a>
        <p style="color:#6b7280;font-size:13px">
          If you didn't request this, you can safely ignore this email —
          your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:11px">Bell Guide</p>
      </div>`,
  });
}

module.exports = { sendPasswordResetEmail };
