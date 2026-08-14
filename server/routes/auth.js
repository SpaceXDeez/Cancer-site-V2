const express     = require('express');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const crypto      = require('crypto');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, isTest } = req.body;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (isTest === true && process.env.ALLOW_TEST_ACCOUNTS !== 'true') {
    return res.status(403).json({ error: 'Test accounts are only available on the staging environment.' });
  }
  try {
    const hash   = await bcrypt.hash(password, 12);
    const result = await db.createUser(email.toLowerCase().trim(), hash, isTest === true);
    const userId = result.lastInsertRowid;
    const token  = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: userId, email: email.toLowerCase().trim(), isTest: isTest === true } });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const user = await db.getUserByEmail(typeof email === 'string' ? email.toLowerCase().trim() : '');
    // Constant-time compare even when user not found to prevent timing attacks
    const dummyHash = '$2a$12$invalidhashfortimingattackprevention000000000000000000';
    const valid = user ? await bcrypt.compare(password, user.password_hash)
                       : await bcrypt.compare(password, dummyHash).then(() => false);
    if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password.' });
    if (user.is_test && process.env.ALLOW_TEST_ACCOUNTS !== 'true') {
      return res.status(403).json({ error: 'Test accounts are only available on the staging environment.' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, isTest: !!user.is_test } });
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
    const user = await db.getUserByEmail(
      (await db.getUserById(req.user.userId))?.email || ''
    );
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    const valid = await bcrypt.compare(currentPassword ?? '', user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await db.updatePasswordHash(req.user.userId, hash);
    res.json({ message: 'Password updated.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  try {
    await db.deleteUser(req.user.userId);
    res.json({ message: 'Account and all associated data deleted.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const isProd = process.env.NODE_ENV === 'production';

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  }
  try {
    const user = await db.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    await db.createPasswordReset(token, user.id, expiresAt);
    const appUrl   = process.env.APP_URL || 'https://ewing-support-ai.up.railway.app';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Respond immediately — never block on SMTP
    res.json(isProd
      ? { message: 'If an account with that email exists, a reset link has been sent.' }
      : { message: 'If an account with that email exists, a reset link has been sent.', devResetUrl: resetUrl }
    );

    // Send email in background
    sendPasswordResetEmail(user.email, resetUrl).catch(err =>
      console.error('Email send failed:', err.message)
    );
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  try {
    const record = await db.getPasswordReset(token);
    const expired = !record || record.used || parseInt(record.expires_at, 10) < Date.now();
    if (expired) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await db.updatePasswordHash(record.user_id, hash);
    await db.markPasswordResetUsed(token);
    const user = await db.getUserById(record.user_id);
    const authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ message: 'Password reset successfully.', token: authToken, user: { id: user.id, email: user.email, isTest: !!user.is_test } });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;

