// Uses Resend HTTP API directly — avoids SMTP port blocking on Railway
async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.SMTP_PASS;
  const from   = process.env.SMTP_FROM || 'Bell Guide <noreply@bell-guide.com>';

  if (!apiKey) {
    console.log(`[EMAIL] No API key configured. Would send "${subject}" to ${to}:\n${text}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

function layout(title, bodyHtml, cta) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#0c3547;margin-top:0">${title}</h2>
      ${bodyHtml}
      <a href="${cta.url}"
         style="display:inline-block;background:#1a7a9e;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:8px;font-weight:600;margin:16px 0;font-size:15px">
        ${cta.label}
      </a>
      <p style="color:#6b7280;font-size:13px">
        If you did not request this, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:11px">Bell Guide</p>
    </div>`;
}

function sendPasswordResetEmail(toEmail, resetUrl) {
  return sendEmail({
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
    html: layout('Reset your password',
      `<p style="color:#374151">You requested a password reset for your <strong>Bell Guide</strong> account.</p>
       <p style="color:#374151">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>`,
      { url: resetUrl, label: 'Reset password' }),
  });
}

function sendWelcomeEmail(toEmail, appUrl) {
  return sendEmail({
    to: toEmail,
    subject: 'Welcome to Bell Guide',
    text: ['Your Bell Guide account is ready.', '', `Sign in here: ${appUrl}`].join('\n'),
    html: layout('Welcome to Bell Guide',
      `<p style="color:#374151">Your <strong>Bell Guide</strong> account is ready. Sign in with the email and password you just chose.</p>`,
      { url: appUrl, label: 'Sign in' }),
  });
}

function sendAccountExistsEmail(toEmail, appUrl) {
  return sendEmail({
    to: toEmail,
    subject: 'You already have a Bell Guide account',
    text: [
      'Someone (hopefully you) tried to create a Bell Guide account with this email address, but an account already exists.',
      '',
      `If you forgot your password, use "Forgot password?" on the sign-in page: ${appUrl}`,
      '',
      "If this wasn't you, no action is needed.",
    ].join('\n'),
    html: layout('You already have an account',
      `<p style="color:#374151">Someone tried to create a <strong>Bell Guide</strong> account with this email address, but you already have one.</p>
       <p style="color:#374151">If you forgot your password, use "Forgot password?" on the sign-in page.</p>`,
      { url: appUrl, label: 'Go to sign in' }),
  });
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, sendAccountExistsEmail };
