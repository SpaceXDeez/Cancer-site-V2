const jwt = require('jsonwebtoken');
const db  = require('../db');

module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const exists = await db.getUserById(req.user.userId);
    if (!exists) return res.status(401).json({ error: 'Account not found. Please log in again.' });
    req.user.isTest = !!exists.is_test;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    next(err);
  }
};
