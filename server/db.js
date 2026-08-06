// Unified async DB interface.
// Local dev: node:sqlite (no install needed, Node >= 22.5)
// Production: PostgreSQL via DATABASE_URL environment variable
// To migrate: set DATABASE_URL in your hosting provider's env vars — no code changes needed.

const path = require('path');
const IS_PG = !!process.env.DATABASE_URL;

let pool = null;    // pg Pool (production)
let sqlite = null;  // DatabaseSync (development)

// ── Schema ────────────────────────────────────────────────────────────────────
const SQLITE_SCHEMA = `
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
    role       TEXT    NOT NULL CHECK(role IN ('user','assistant')),
    content    TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now'))
  );
`;

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS profiles (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       TEXT    NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS chats (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS messages (
    id         BIGSERIAL PRIMARY KEY,
    chat_id    BIGINT  NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role       TEXT    NOT NULL CHECK(role IN ('user','assistant')),
    content    TEXT    NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

// ── Initialize (call once at server startup) ──────────────────────────────────
async function initDb() {
  if (IS_PG) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pool.query(PG_SCHEMA);
    console.log('Connected to PostgreSQL');
  } else {
    const { DatabaseSync } = require('node:sqlite');
    sqlite = new DatabaseSync(path.join(__dirname, 'data.db'));
    sqlite.exec('PRAGMA journal_mode = WAL');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec(SQLITE_SCHEMA);
    console.log('Using SQLite (local dev)');
  }
}

// ── Low-level helpers ─────────────────────────────────────────────────────────
// Convert SQLite ? placeholders to PostgreSQL $1, $2, ... 
function pgify(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function pgRun(sql, params = []) {
  const res = await pool.query(pgify(sql), params);
  return { lastInsertRowid: res.rows[0]?.id ?? null, changes: res.rowCount };
}
async function pgGet(sql, params = []) {
  const res = await pool.query(pgify(sql), params);
  return res.rows[0] || null;
}
async function pgAll(sql, params = []) {
  const res = await pool.query(pgify(sql), params);
  return res.rows;
}

function sqRun(sql, params = []) {
  return sqlite.prepare(sql).run(...params);
}
function sqGet(sql, params = []) {
  return sqlite.prepare(sql).get(...params) || null;
}
function sqAll(sql, params = []) {
  return sqlite.prepare(sql).all(...params);
}

// ── Named DB operations ───────────────────────────────────────────────────────
const db = {
  initDb,

  // Users
  async createUser(email, hash) {
    if (IS_PG) return pgRun('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id', [email, hash]);
    return sqRun('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
  },
  async getUserByEmail(email) {
    const q = 'SELECT * FROM users WHERE email = ?';
    if (IS_PG) return pgGet(q + ' LIMIT 1', [email.toLowerCase()]);
    return sqGet(q, [email]);
  },
  async getUserById(id) {
    const q = 'SELECT id FROM users WHERE id = ?';
    if (IS_PG) return pgGet(q, [id]);
    return sqGet(q, [id]);
  },

  // Profiles
  async upsertProfile(userId, data) {
    const q = IS_PG
      ? `INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, NOW())
         ON CONFLICT(user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`
      : `INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`;
    if (IS_PG) return pgRun(q, [userId, data]);
    return sqRun(q, [userId, data]);
  },
  async getProfile(userId) {
    const q = 'SELECT data FROM profiles WHERE user_id = ?';
    if (IS_PG) return pgGet(q, [userId]);
    return sqGet(q, [userId]);
  },

  // Chats
  async createChat(userId, name) {
    if (IS_PG) return pgRun('INSERT INTO chats (user_id, name) VALUES (?, ?) RETURNING id', [userId, name]);
    return sqRun('INSERT INTO chats (user_id, name) VALUES (?, ?)', [userId, name]);
  },
  async getChats(userId) {
    const q = 'SELECT id, name, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC';
    if (IS_PG) return pgAll(q, [userId]);
    return sqAll(q, [userId]);
  },
  async getChatById(chatId, userId) {
    const q = 'SELECT * FROM chats WHERE id = ? AND user_id = ?';
    if (IS_PG) return pgGet(q, [chatId, userId]);
    return sqGet(q, [chatId, userId]);
  },
  async renameChat(chatId, userId, name) {
    const q = 'UPDATE chats SET name = ? WHERE id = ? AND user_id = ?';
    if (IS_PG) return pgRun(q, [name, chatId, userId]);
    return sqRun(q, [name, chatId, userId]);
  },
  async deleteChat(chatId, userId) {
    const q = 'DELETE FROM chats WHERE id = ? AND user_id = ?';
    if (IS_PG) return pgRun(q, [chatId, userId]);
    return sqRun(q, [chatId, userId]);
  },

  // Messages
  async insertMessage(chatId, role, content) {
    const q = 'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)';
    if (IS_PG) return pgRun(q, [chatId, role, content]);
    return sqRun(q, [chatId, role, content]);
  },
  async getMessages(chatId) {
    const q = 'SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC';
    if (IS_PG) return pgAll(q, [chatId]);
    return sqAll(q, [chatId]);
  },
};

module.exports = db;

