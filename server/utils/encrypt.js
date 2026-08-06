const crypto = require('crypto');

const KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : null;

if (KEY && KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
}

const ALGO   = 'aes-256-gcm';
const PREFIX = 'enc:'; // distinguishes encrypted values from legacy plaintext

function encrypt(plaintext) {
  if (!KEY || plaintext == null) return plaintext;
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const body   = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return PREFIX + [iv, tag, body].map(b => b.toString('base64')).join('.');
}

function decrypt(ciphertext) {
  if (!KEY || ciphertext == null) return ciphertext;
  if (typeof ciphertext !== 'string' || !ciphertext.startsWith(PREFIX)) return ciphertext;
  try {
    const [ivB64, tagB64, bodyB64] = ciphertext.slice(PREFIX.length).split('.');
    const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return decipher.update(Buffer.from(bodyB64, 'base64')) + decipher.final('utf8');
  } catch {
    // Should not happen in normal operation; return raw to avoid data loss
    return ciphertext;
  }
}

module.exports = { encrypt, decrypt };
