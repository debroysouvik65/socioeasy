const Queue = require('bull');
const db = require('../config/database');
const logger = require('../config/logger');
const PlatformAdapters = require('./platforms/PlatformAdapters');

class PostService {
  constructor() {
    this.queue = new Queue('posts', {
      redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD }
    });
    this.setupProcessors();
  }

  setupProcessors() {
    this.queue.process(async (job) => {
      const { postId, connectionId } = job.data;
      await this.publishToPlatform(postId, connectionId);
    });
  }

  async publishToPlatform(postId, connectionId) {
    const post = await db('posts').where({ id: postId }).first();
    const connection = await db('platform_connections').where({ id: connectionId }).first();
    
    const adapter = PlatformAdapters.getAdapter(connection.platform);
    
    try {
      const result = await adapter.publish({
        content: post.content,
        mediaUrls: JSON.parse(post.media_urls || '[]'),
        accessToken: connection.access_token
      });

      await db('post_results').insert({
        id: require('uuid').v4(),
        post_id: postId,
        platform: connection.platform,
        platform_post_id: result.id,
        platform_post_url: result.url,
        status: 'published',
        published_at: new Date()
      });

      logger.info(`Published ${postId} to ${connection.platform}`);
    } catch (error) {
      logger.error(`Failed to publish ${postId}`, error);
      throw error;
    }
  }

  async queuePost(post, connections) {
    for (const conn of connections) {
      await this.queue.add({ postId: post.id, connectionId: conn.id }, { attempts: 3 });
    }
    await db('posts').where({ id: post.id }).update({ status: 'publishing' });
  }

  async schedulePost(post, connections) {
    const delay = new Date(post.scheduled_at).getTime() - Date.now();
    for (const conn of connections) {
      await this.queue.add(
        { postId: post.id, connectionId: conn.id },
        { delay: Math.max(delay, 0), attempts: 3 }
      );
    }
  }
}

module.exports = new PostService();
