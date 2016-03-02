var fs = require('fs');
var log = require('../log');
var rpc = require('./rpc');
var utils = require('./utils');

var fifoPath = './local/node.fifo';
var logger = new log.Log(log.logger.console('fifo'));

module.exports = { start: listen };

function listen(handlePlugin, sendClientMessage, sendClientError) {
  var state = {
    buffer: '', // Buffer of accumulated input
    tag: '', // State variable to note tag that we are handling
  };

  var handlers = {
    rpc: rpc.handle,
    plugin: handlePlugin,
    clientMessage: sendClientMessage,
    clientError: sendClientError,
  };

  openStream();

  function handleData(part) {
    logger.debug('RECEIVED PART', part.toString());
    state.buffer += part;

    // Process the buffer
    while (state.buffer) {
      // If we do not know the data type (tag), extract it into state.tag
      if (!state.tag) {
        utils.extractStartTag(state, handlers.clientError); // This modifies state.buffer and state.tag
        if (state.tag) {
          continue; // Start tag found, cycle again to process data
        } else {
          return; // No start tag found - wait for more data
        }
      } else {
        // Find the end tag
        var endTag = '<END' + state.tag + '>\n';
        var endIndex = state.buffer.indexOf(endTag);

        // If no end tag found, wait for more data
        if (endIndex === -1) { return; }

        // Grab the data
        var msg = state.buffer.substr(0, endIndex);

        // Handle the parsed message
        utils.forwardToHandler(state.tag, msg, handlers);

        // Cycle the buffer past the end tag
        state.buffer = state.buffer.substr(endIndex + endTag.length);

        // Reset the start tag to process new data
        state.tag = '';
      }
    }
  }

  function openStream() {
    logger.debug('INFO: opening fifo');
    var stopped = false;

    // keep it open by opening it ourselves
    var commandFifo = fs.createReadStream(fifoPath);

    commandFifo.on('end', function() {
      logger.info('Ended', arguments);

      if (!stopped) { openStream(); }
      stopped = true;
    });
    commandFifo.on('close', function() {
      logger.info('Closed', arguments);

      if (!stopped) { openStream(); }
      stopped = true;
    });
    commandFifo.on('open', function() {
      // open for writing so that fifoPath stays open for reading
      fs.createWriteStream(fifoPath);

      logger.info('Opened', arguments);
    });
    commandFifo.on('error', function(err) {
      logger.error(err);
      openStream();
    });
    commandFifo.on('data', handleData);
  }
}
