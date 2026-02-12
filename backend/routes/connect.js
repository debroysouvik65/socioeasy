const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const redis = require('../config/redis');
const { authenticate } = require('../middleware/auth');
const PlatformService = require('../services/PlatformService');

const router = express.Router();

const platforms = [
  { id: 'twitter', name: 'Twitter/X', oauth: true, features: ['post', 'schedule', 'analytics', 'dm'] },
  { id: 'facebook', name: 'Facebook', oauth: true, features: ['post', 'schedule', 'analytics'] },
  { id: 'instagram', name: 'Instagram', oauth: true, features: ['post', 'schedule', 'analytics'] },
  { id: 'linkedin', name: 'LinkedIn', oauth: true, features: ['post', 'schedule', 'analytics'] },
  { id: 'pinterest', name: 'Pinterest', oauth: true, features: ['post', 'schedule'] },
  { id: 'tiktok', name: 'TikTok', oauth: true, features: ['post', 'schedule', 'analytics'] },
  { id: 'youtube', name: 'YouTube', oauth: true, features: ['post', 'schedule', 'analytics'] },
  { id: 'reddit', name: 'Reddit', oauth: true, features: ['post', 'schedule'] },
  { id: 'tumblr', name: 'Tumblr', oauth: true, features: ['post', 'schedule'] },
  { id: 'discord', name: 'Discord', oauth: true, features: ['post', 'schedule'] },
  { id: 'telegram', name: 'Telegram', oauth: true, features: ['post', 'schedule'] },
  { id: 'threads', name: 'Threads', oauth: true, features: ['post', 'schedule'] },
  { id: 'bluesky', name: 'Bluesky', oauth: true, features: ['post', 'schedule'] }
];

router.get('/platforms', (req, res) => res.json({ platforms }));

router.get('/:platform', authenticate, async (req, res, next) => {
  try {
    const { platform } = req.params;
    const state = uuidv4();
    await redis.setex(`oauth:${state}`, 600, JSON.stringify({ userId: req.user.id, platform }));
    const authUrl = await PlatformService.getAuthUrl(platform, state);
    res.json({ authUrl, state });
  } catch (error) { next(error); }
});

router.get('/:platform/callback', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;
    
    const data = await redis.get(`oauth:${state}`);
    if (!data) return res.redirect(`${process.env.CLIENT_URL}/connect?error=invalid_state`);
    
    const { userId } = JSON.parse(data);
    const tokens = await PlatformService.exchangeCode(platform, code);
    const platformUser = await PlatformService.getUserInfo(platform, tokens);

    await db('platform_connections').insert({
      id: uuidv4(), user_id: userId, platform,
      platform_user_id: platformUser.id,
      platform_username: platformUser.username,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      active: true, created_at: new Date()
    }).onConflict(['user_id', 'platform']).merge();

    res.redirect(`${process.env.CLIENT_URL}/connect?success=true`);
  } catch (error) { next(error); }
});

router.get('/', authenticate, async (req, res) => {
  const connections = await db('platform_connections')
    .where({ user_id: req.user.id, active: true })
    .select('id', 'platform', 'platform_username', 'created_at');
  res.json({ connections });
});

module.exports = router;
