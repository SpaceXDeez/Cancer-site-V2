// Cloudflare sets cf-connecting-ip to the true client IP; X-Forwarded-For can be attacker-controlled
module.exports = function getClientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  return (typeof cf === 'string' && cf.trim()) || req.ip || 'unknown';
};
