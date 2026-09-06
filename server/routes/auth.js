const express     = require('express');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const crypto      = require('crypto');
const rateLimit   = require('express-rate-limit');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const getClientIp = require('../utils/clientIp');
const { sendPasswordResetEmail, sendWelcomeEmail, sendAccountExistsEmail } = require('../utils/email');

const router = express.Router();

const APP_URL   = () => (process.env.APP_URL || 'https://bell-guide.com').replace(/\/$/, '');
const normEmail = e => (typeof e === 'string' ? e.toLowerCase().trim() : '');
const signToken = user => jwt.sign({ userId: user.id, tv: Number(user.token_version ?? 0) }, process.env.JWT_SECRET, { expiresIn: '30d' });
const publicUser = (user, isTest) => ({ id: user.id, email: user.email, isTest: isTest ?? !!user.is_test });

// ── Rate limiters ──────────────────────────────────────────────────────────────────────
// validate:false — custom keys are intentionally not bare IPs, which the library would otherwise warn about
const limiter = (opts) => rateLimit({ standardHeaders: true, legacyHeaders: false, validate: false, ...opts });
const tooMany = msg => ({ error: msg });

const ipEmailKey = req => `${getClientIp(req)}:${normEmail(req.body?.email)}`;

const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000, max: 10, keyGenerator: ipEmailKey,
  message: tooMany('Too many sign-in attempts. Please wait 15 minutes and try again.'),
});
// Lockout: counts only failed attempts per email, regardless of IP
const lockoutLimiter = limiter({
  windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true,
  keyGenerator: req => `lock:${normEmail(req.body?.email)}`,
  message: tooMany('This account is temporarily locked after too many failed sign-in attempts. Try again in 15 minutes.'),
});
const registerLimiter = limiter({
  windowMs: 15 * 60 * 1000, max: 10, keyGenerator: ipEmailKey,
  message: tooMany('Too many registration attempts. Please wait and try again.'),
});
const forgotIpLimiter = limiter({
  windowMs: 60 * 60 * 1000, max: 5, keyGenerator: req => `forgot-ip:${getClientIp(req)}`,
  message: tooMany('Too many password reset requests. Please try again later.'),
});
const forgotEmailLimiter = limiter({
  windowMs: 60 * 60 * 1000, max: 3, keyGenerator: req => `forgot-email:${normEmail(req.body?.email)}`,
  message: tooMany('Too many password reset requests for this email. Please try again later.'),
});
const resetLimiter = limiter({
  windowMs: 15 * 60 * 1000, max: 10, keyGenerator: req => `reset:${getClientIp(req)}`,
  message: tooMany('Too many attempts. Please try again later.'),
});

// Constant used so that "user not found" paths burn the same bcrypt cost as real ones
const DUMMY_HASH = '$2a$12$invalidhashfortimingattackprevention000000000000000000';
const burnBcrypt = () => bcrypt.compare('timing-equaliser', DUMMY_HASH).catch(() => false);

router.post('/register', registerLimiter, async (req, res) => {
  const { password, isTest } = req.body;
  const email = normEmail(req.body.email);
  const generic = { message: 'Check your email to continue.' };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (isTest === true && process.env.ALLOW_TEST_ACCOUNTS !== 'true') {
    return res.status(403).json({ error: 'Test accounts are only available on the staging environment.' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    let created = null;
    try {
      const result = await db.createUser(email, hash, isTest === true);
      created = { id: result.lastInsertRowid, email, token_version: 0, is_test: isTest === true };
    } catch (err) {
      if (!(err.message?.includes('UNIQUE') || err.code === '23505')) throw err;
    }

    // Staging test accounts need an immediate token for the automated flow
    if (created && isTest === true) {
      return res.json({ ...generic, token: signToken(created), user: publicUser(created, true) });
    }

    // Identical response whether the account is new or already existed — the email tells them which
    res.json(generic);
    (created ? sendWelcomeEmail(email, APP_URL()) : sendAccountExistsEmail(email, APP_URL()))
      .catch(err => console.error('Register email failed:', err.message));
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', loginLimiter, lockoutLimiter, async (req, res) => {
  const { password } = req.body;
  const email = normEmail(req.body.email);
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const user = await db.getUserByEmail(email);
    const valid = user ? await bcrypt.compare(password, user.password_hash) : await burnBcrypt();
    if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password.' });
    if (user.is_test && process.env.ALLOW_TEST_ACCOUNTS !== 'true') {
      return res.status(403).json({ error: 'Test accounts are only available on the staging environment.' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.post('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    const valid = await bcrypt.compare(currentPassword ?? '', user.password_hash);
    // 403 not 401 — the client treats 401 as an expired session and signs the user out
    if (!valid) return res.status(403).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await db.updatePasswordHash(req.user.userId, hash);
    await db.bumpTokenVersion(req.user.userId);
    // Every other session is now invalid; hand this one a fresh token so it stays signed in
    const fresh = await db.getUserById(req.user.userId);
    res.json({ message: 'Password updated.', token: signToken(fresh), user: publicUser(fresh) });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  const { currentPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return res.status(400).json({ error: 'Enter your current password to delete your account.' });
  }
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(403).json({ error: 'Password is incorrect.' });
    await db.deleteUser(req.user.userId);
    res.json({ message: 'Account and all associated data deleted.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
});

router.post('/forgot-password', forgotIpLimiter, forgotEmailLimiter, async (req, res) => {
  const email  = normEmail(req.body.email);
  const isProd = process.env.NODE_ENV === 'production';
  const generic = { message: 'If an account with that email exists, a reset link has been sent.' };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json(generic);
  try {
    const user = await db.getUserByEmail(email);
    // Same bcrypt cost on both branches so response time doesn't reveal whether the email exists
    await burnBcrypt();
    if (!user) return res.json(generic);

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    await db.createPasswordReset(token, user.id, expiresAt);
    const resetUrl = `${APP_URL()}/reset-password?token=${token}`;

    res.json(isProd ? generic : { ...generic, devResetUrl: resetUrl });
    sendPasswordResetEmail(user.email, resetUrl).catch(err => console.error('Email send failed:', err.message));
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.json(generic);
  }
});

router.post('/reset-password', resetLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }
  try {
    const record = await db.getPasswordReset(token);
    const expired = !record || record.used || parseInt(record.expires_at, 10) < Date.now();
    if (expired) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await db.updatePasswordHash(record.user_id, hash);
    await db.markPasswordResetUsed(token);
    await db.bumpTokenVersion(record.user_id);
    const user = await db.getUserById(record.user_id);
    res.json({ message: 'Password reset successfully.', token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;

