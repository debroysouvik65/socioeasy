const axios = require('axios');

class LinkedInAdapter {
  async publish({ content, mediaUrls, accessToken }) {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    
    const response = await axios.post(url, {
      author: 'urn:li:person:your_person_id',
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: mediaUrls?.length > 0 ? 'IMAGE' : 'NONE'
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: response.data.id,
      url: `https://linkedin.com/feed/update/${response.data.id}`
    };
  }
}

module.exports = LinkedInAdapter;
