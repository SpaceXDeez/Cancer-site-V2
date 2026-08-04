// Database layer using Node.js built-in sqlite (Node >= 22.5, no compilation needed)
// To migrate to PostgreSQL: replace DatabaseSync with pg.Pool and convert to async/await
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'data.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       TEXT    NOT NULL DEFAULT '{}',
    updated_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL DEFAULT 'New Chat',
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id    INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role       TEXT    NOT NULL CHECK(role IN ('user', 'assistant')),
    content    TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now'))
  );
`);

module.exports = {
  // Users
  createUser:     db.prepare(`INSERT INTO users (email, password_hash) VALUES (?, ?)`),
  getUserByEmail: db.prepare(`SELECT * FROM users WHERE email = ?`),

  // Profiles
  upsertProfile: db.prepare(`
    INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `),
  getProfile: db.prepare(`SELECT data FROM profiles WHERE user_id = ?`),

  // Chats
  createChat:  db.prepare(`INSERT INTO chats (user_id, name) VALUES (?, ?)`),
  getChats:    db.prepare(`SELECT id, name, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC`),
  getChatById: db.prepare(`SELECT * FROM chats WHERE id = ? AND user_id = ?`),
  renameChat:  db.prepare(`UPDATE chats SET name = ? WHERE id = ? AND user_id = ?`),
  deleteChat:  db.prepare(`DELETE FROM chats WHERE id = ? AND user_id = ?`),

  // Messages
  insertMessage: db.prepare(`INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)`),
  getMessages:   db.prepare(`SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC`),
};

