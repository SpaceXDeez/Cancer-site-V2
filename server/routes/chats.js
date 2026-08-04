const express      = require('express');
const db           = require('../db');
const requireAuth  = require('../middleware/auth');

const router = express.Router();

// GET /api/chats — list all chats for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const chats = await db.getChats(req.user.userId);
    res.json({ chats });
  } catch (err) {
    console.error('Get chats error:', err.message);
    res.status(500).json({ error: 'Failed to load chats.' });
  }
});

// POST /api/chats — create a new chat
router.post('/', requireAuth, async (req, res) => {
  try {
    const name   = (req.body.name || 'New Chat').slice(0, 200);
    const result = await db.createChat(req.user.userId, name);
    const chatId = result.lastInsertRowid;
    const chat   = await db.getChatById(chatId, req.user.userId);
    res.status(201).json({ chat });
  } catch (err) {
    console.error('Create chat error:', err.message);
    res.status(500).json({ error: 'Failed to create chat.' });
  }
});

// GET /api/chats/:id — get a specific chat (ownership verified)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const chat = await db.getChatById(req.params.id, req.user.userId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    res.json({ chat });
  } catch (err) {
    console.error('Get chat error:', err.message);
    res.status(500).json({ error: 'Failed to load chat.' });
  }
});

// PATCH /api/chats/:id — rename a chat
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const name = (req.body.name || '').trim().slice(0, 200);
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    await db.renameChat(req.params.id, req.user.userId, name);
    res.json({ success: true });
  } catch (err) {
    console.error('Rename chat error:', err.message);
    res.status(500).json({ error: 'Failed to rename chat.' });
  }
});

// DELETE /api/chats/:id — delete a chat (and its messages via CASCADE)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteChat(req.params.id, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete chat error:', err.message);
    res.status(500).json({ error: 'Failed to delete chat.' });
  }
});

// GET /api/chats/:id/messages — get all messages for a chat
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const chat = await db.getChatById(req.params.id, req.user.userId);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    const messages = await db.getMessages(req.params.id);
    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

module.exports = router;

