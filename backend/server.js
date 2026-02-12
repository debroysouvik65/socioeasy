const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SocioEasy API is running', timestamp: new Date().toISOString() });
});

// Get all platforms
app.get('/api/v1/connect/platforms', (req, res) => {
  res.json({
    platforms: [
      { id: 'twitter', name: 'Twitter/X', features: ['post', 'schedule', 'analytics', 'dm'] },
      { id: 'facebook', name: 'Facebook', features: ['post', 'schedule', 'analytics'] },
      { id: 'instagram', name: 'Instagram', features: ['post', 'schedule', 'analytics'] },
      { id: 'linkedin', name: 'LinkedIn', features: ['post', 'schedule', 'analytics'] },
      { id: 'pinterest', name: 'Pinterest', features: ['post', 'schedule'] },
      { id: 'tiktok', name: 'TikTok', features: ['post', 'schedule', 'analytics'] },
      { id: 'youtube', name: 'YouTube', features: ['post', 'schedule', 'analytics'] },
      { id: 'reddit', name: 'Reddit', features: ['post', 'schedule'] },
      { id: 'tumblr', name: 'Tumblr', features: ['post', 'schedule'] },
      { id: 'discord', name: 'Discord', features: ['post', 'schedule'] },
      { id: 'telegram', name: 'Telegram', features: ['post', 'schedule'] },
      { id: 'threads', name: 'Threads', features: ['post', 'schedule'] },
      { id: 'bluesky', name: 'Bluesky', features: ['post', 'schedule'] }
    ]
  });
});

// Mock auth endpoints
app.post('/api/v1/auth/register', (req, res) => {
  res.json({ 
    user: { id: '123', email: req.body.email, name: req.body.name },
    token: 'mock_jwt_token',
    apiKey: 'se_mock_api_key_12345'
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  res.json({ 
    user: { id: '123', email: req.body.email, name: 'User' },
    token: 'mock_jwt_token',
    apiKeys: ['se_mock_api_key_12345']
  });
});

// Mock posts endpoint
app.post('/api/v1/posts', (req, res) => {
  res.json({
    id: 'post_' + Date.now(),
    status: 'published',
    platforms: req.body.platforms,
    message: 'Post published successfully to ' + req.body.platforms.join(', ')
  });
});

app.get('/api/v1/posts', (req, res) => {
  res.json({
    posts: [],
    pagination: { page: 1, limit: 20, total: 0 }
  });
});

// Mock analytics
app.get('/api/v1/analytics/overview', (req, res) => {
  res.json({
    posts: 0,
    impressions: 0,
    engagements: 0,
    reach: 0,
    platforms: 13
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 SocioEasy API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
