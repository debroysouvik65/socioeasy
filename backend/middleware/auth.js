const passport = require('passport');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = passport.authenticate('jwt', { session: false });

const generateToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const checkApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const keyData = await db('api_keys')
    .where({ key: apiKey, active: true })
    .where('expires_at', '>', new Date())
    .first();

  if (!keyData) return res.status(401).json({ error: 'Invalid or expired API key' });

  await db('api_keys').where({ id: keyData.id }).update({ last_used_at: new Date() });
  req.user = await db('users').where({ id: keyData.user_id }).first();
  req.apiKey = keyData;
  next();
};

module.exports = { authenticate, generateToken, checkApiKey };
