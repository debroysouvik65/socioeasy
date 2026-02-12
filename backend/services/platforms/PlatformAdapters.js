const TwitterAdapter = require('./TwitterAdapter');
const FacebookAdapter = require('./FacebookAdapter');
const InstagramAdapter = require('./InstagramAdapter');
const LinkedInAdapter = require('./LinkedInAdapter');

const adapters = {
  twitter: new TwitterAdapter(),
  facebook: new FacebookAdapter(),
  instagram: new InstagramAdapter(),
  linkedin: new LinkedInAdapter()
};

class PlatformAdapters {
  static getAdapter(platform) {
    return adapters[platform] || adapters.twitter;
  }
}

module.exports = PlatformAdapters;
