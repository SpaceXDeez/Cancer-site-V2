const express     = require('express');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, isTest } = req.body;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
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
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, isTest: !!user.is_test } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
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

module.exports = router;

