// Uses Resend HTTP API directly — avoids SMTP port blocking on Railway
async function sendPasswordResetEmail(toEmail, resetUrl) {
  const apiKey = process.env.SMTP_PASS;
  const from   = process.env.SMTP_FROM || 'Bell Guide <noreply@bell-guide.com>';

  if (!apiKey) {
    console.log(`[PASSWORD RESET] No API key configured. Link for ${toEmail}:\n  ${resetUrl}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [toEmail],
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
            If you did not request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="color:#9ca3af;font-size:11px">Bell Guide</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

module.exports = { sendPasswordResetEmail };
