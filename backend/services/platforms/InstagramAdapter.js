const axios = require('axios');

class InstagramAdapter {
  async publish({ content, mediaUrls, accessToken }) {
    const accountId = 'your_instagram_account_id';
    
    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error('Instagram requires media');
    }

    // Create media container
    const containerUrl = `https://graph.facebook.com/v18.0/${accountId}/media`;
    const container = await axios.post(containerUrl, {
      image_url: mediaUrls[0],
      caption: content,
      access_token: accessToken
    });

    // Publish
    const publishUrl = `https://graph.facebook.com/v18.0/${accountId}/media_publish`;
    const publish = await axios.post(publishUrl, {
      creation_id: container.data.id,
      access_token: accessToken
    });

    return {
      id: publish.data.id,
      url: `https://instagram.com/p/${publish.data.id}`
    };
  }
}

module.exports = InstagramAdapter;
