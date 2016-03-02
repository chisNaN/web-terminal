var gets = require('https').get;
var Promise = require('bluebird');

module.exports = {
  Gets: Prefetch,
};

function Prefetch(address) {
  this.response = new Promise(function(resolver, rejecter) {
    gets(address, resolver).on('error', rejecter);
  });
}

Prefetch.prototype.xFrameOptions = function() {
  return this.response.then(function(res) {
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/X-Frame-Options
    var xFrameOptions = res.headers['x-frame-options'];

    switch (xFrameOptions) {
      case 'DENY':
      case 'SAMEORIGIN':
      case 'ALLOW-FROM':
        return true;
      default:
        return false;
    }
  });
};
