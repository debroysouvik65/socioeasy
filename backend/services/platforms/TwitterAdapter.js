const { TwitterApi } = require('twitter-api-v2');

class TwitterAdapter {
  async publish({ content, mediaUrls, accessToken }) {
    const client = new TwitterApi(accessToken);
    
    let mediaIds = [];
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        const mediaId = await client.v1.uploadMedia(url);
        mediaIds.push(mediaId);
      }
    }

    const tweet = await client.v2.tweet({
      text: content,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
    });

    return {
      id: tweet.data.id,
      url: `https://twitter.com/i/web/status/${tweet.data.id}`
    };
  }
}

module.exports = TwitterAdapter;
