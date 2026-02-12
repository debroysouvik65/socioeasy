const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate, checkApiKey } = require('../middleware/auth');
const PostService = require('../services/PostService');

const router = express.Router();

router.post('/', checkApiKey, async (req, res, next) => {
  try {
    const { content, platforms, scheduledAt, mediaUrls, options } = req.body;
    const userId = req.user.id;

    const connections = await db('platform_connections')
      .where({ user_id: userId, active: true })
      .whereIn('platform', platforms);

    const missing = platforms.filter(p => !connections.find(c => c.platform === p));
    if (missing.length > 0) return res.status(400).json({ error: 'Platforms not connected', missing });

    const [post] = await db('posts').insert({
      id: uuidv4(), user_id: userId, content,
      media_urls: JSON.stringify(mediaUrls || []),
      platforms: JSON.stringify(platforms),
      status: scheduledAt ? 'scheduled' : 'pending',
      scheduled_at: scheduledAt || null,
      options: JSON.stringify(options || {}),
      created_at: new Date()
    }).returning('*');

    if (!scheduledAt) await PostService.queuePost(post, connections);
    else await PostService.schedulePost(post, connections);

    res.status(201).json({ id: post.id, status: post.status, platforms });
  } catch (error) { next(error); }
});

router.get('/', authenticate, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let query = db('posts').where({ user_id: req.user.id }).orderBy('created_at', 'desc');
  if (status) query = query.where({ status });
  
  const posts = await query.limit(limit).offset((page - 1) * limit);
  res.json({
    posts: posts.map(p => ({ ...p, platforms: JSON.parse(p.platforms) })),
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
});

module.exports = router;
