const axios = require('axios');

class FacebookAdapter {
  async publish({ content, mediaUrls, accessToken }) {
    const pageId = 'your_page_id'; // Get from connection
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const response = await axios.post(url, {
      message: content,
      access_token: accessToken,
      ...(mediaUrls?.[0] && { link: mediaUrls[0] })
    });

    return {
      id: response.data.id,
      url: `https://facebook.com/${response.data.id}`
    };
  }
}

module.exports = FacebookAdapter;
