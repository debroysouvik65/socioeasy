const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const redis = require('../config/redis');
const { generateToken } = require('../middleware/auth');
const EmailService = require('../services/EmailService');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, company } = req.body;
    
    if (await db('users').where({ email }).first()) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db('users').insert({
      id: uuidv4(), email, password_hash: passwordHash, name, company,
      plan: 'free', role: 'user', created_at: new Date()
    }).returning('*');

    const [apiKey] = await db('api_keys').insert({
      id: uuidv4(), user_id: user.id,
      key: `se_${Buffer.from(uuidv4()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
      name: 'Default Key', active: true, created_at: new Date()
    }).returning('key');

    await EmailService.sendWelcomeEmail(user);
    const token = generateToken(user);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
      token, apiKey: apiKey.key
    });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db('users').where({ email }).first();

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await db('users').where({ id: user.id }).update({ last_login: new Date() });
    const token = generateToken(user);
    const apiKeys = await db('api_keys').where({ user_id: user.id, active: true }).select('key');

    res.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
      token, apiKeys: apiKeys.map(k => k.key)
    });
  } catch (error) { next(error); }
});

module.exports = router;
