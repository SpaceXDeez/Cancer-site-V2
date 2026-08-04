const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ chats: db.getChats.all(req.user.userId) });
});

router.post('/', requireAuth, (req, res) => {
  const name   = (typeof req.body.name === 'string' ? req.body.name : 'New Chat').slice(0, 200);
  const result = db.createChat.run(req.user.userId, name);
  const chat   = db.getChatById.get(result.lastInsertRowid, req.user.userId);
  res.json({ chat });
});

router.put('/:id', requireAuth, (req, res) => {
  const { name } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  const result = db.renameChat.run(name.trim().slice(0, 200), req.params.id, req.user.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Chat not found.' });
  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.deleteChat.run(req.params.id, req.user.userId);
  res.json({ success: true });
});

router.get('/:id/messages', requireAuth, (req, res) => {
  if (!db.getChatById.get(req.params.id, req.user.userId)) {
    return res.status(404).json({ error: 'Chat not found.' });
  }
  res.json({ messages: db.getMessages.all(req.params.id) });
});

module.exports = router;
