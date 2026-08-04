const express      = require('express');
const db           = require('../db');
const requireAuth  = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const row = await db.getProfile(req.user.userId);
    res.json({ profile: row ? JSON.parse(row.data) : {} });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    await db.upsertProfile(req.user.userId, data);
    res.json({ success: true });
  } catch (err) {
    console.error('Save profile error:', err.message);
    res.status(500).json({ error: 'Failed to save profile.' });
  }
});

module.exports = router;

