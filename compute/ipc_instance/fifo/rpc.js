var fs = require('fs');
var log = require('../log');

var fifoPath = './local/from_node.fifo';
var logger = new log.Log(log.logger.console('fifo-rpc'));

module.exports = { handler: handleRPC };

function handleRPC(data) {
  var msg;
  try {
    msg = JSON.parse(data);
  } catch (err) {
    logger.error('Could not parse RPC', data);
    logger.error(err, err.stack);
    sendResponse({ error: 'Error parsing' });
    return;
  }

  if (msg.type === 'echo') {
    sendResponse({ error: null, result: msg });
  } else {
    logger.warn('Unknown or missing type', msg.type);
    sendResponse({ error: 'Unknown type or missing type: ' + msg.type });
  }
}

function sendResponse(msg) {
  var stream = fs.createWriteStream(fifoPath);
  logger.debug('Writing', msg);

  stream.once('open', function() {
    logger.debug('STREAM opened');
    stream.write('<RESPONSE>\n');
    stream.write(JSON.stringify(msg));
    stream.write('<ENDRESPONSE>\n');
    stream.end();
    logger.debug('Wrote', msg);
  });

  stream.on('error', function(err) {
    logger.error('STREAM error', err);
    stream.end();

    // Reattempt to send the response
    sendResponse(msg);
  });
}
