// TODO: Share this code with the client using browserify

var protocol = 'https:'; // Mixed-content prevents any requests besides https

module.exports = {
  getUrlFromInfo: getUrlFromInfo,
};

function getUrlFromInfo(info) {
  if (info.url) {
    // TODO: parse localhost, here
    var parts = info.url.split('//');
    if (parts.length === 1) {
      parts = [protocol, parts[0]];
    } else {
      parts[0] = protocol;
    }

    // parse localhost properly
    var pathParts = parts[1].split('/');
    var portParts = pathParts[0].split(':');
    if (portParts[0] === 'localhost' || portParts[0] === '127.0.0.1') {
      return false; // This can always be served
    }

    return parts.join('//');
  }
}
