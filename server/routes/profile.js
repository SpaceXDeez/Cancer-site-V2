const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const row = db.getProfile.get(req.user.userId);
  res.json({ profile: row ? JSON.parse(row.data) : {} });
});

router.put('/', requireAuth, (req, res) => {
  const { profile } = req.body;
  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
    return res.status(400).json({ error: 'Invalid profile data.' });
  }
  db.upsertProfile.run(req.user.userId, JSON.stringify(profile));
  res.json({ success: true });
});

module.exports = router;
