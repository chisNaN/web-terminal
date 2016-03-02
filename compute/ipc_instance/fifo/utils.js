var log = require('../log');
var logger = new log.Log(log.logger.console('fifo-utils'));

var fifoTags = [
  'SERVERMESSAGE',
  'CLIENTMESSAGE',
  'PLOT',
  'RPC',
];

// Find the longest tag length
var fifoMaxTagLength = 0;
fifoTags.reduce(function(max, tag) { return Math.max(tag.length, max); });
fifoMaxTagLength += 3; // <*>\n

module.exports = {
  extractStartTag: extractStartTag,
  forwardToHandler: forwardToHandler,
};

function extractStartTag(state, sendError) {
  var startIx = state.buffer.indexOf('<');

  // If no '<' found, empty the buffer and get out of loop
  if (startIx === -1) {
    if (state.buffer.length > 0) {
      sendError('PARSE ERR 1: ' + state.buffer);
      logger.warn('Failed to parse', 'Could not find start tag', state.buffer);
      state.buffer = ''; // Reset the buffer
    }

    return;

  // If '<' found but not at start, cycle buffer to '<'
  } else if (startIx > 0) {
    sendError('PARSE ERR 2: ' + state.buffer.substr(0, startIx));
    logger.warn('Failed to parse', '< found after 0th index', state.buffer.substr(0, startIx));
    state.buffer = state.buffer.substr(startIx); // Cycle buffer
  }

  // Match the fifoTag
  var tagsRegexp = new RegExp('<(' + fifoTags.join('|') + ')>\n', 'g');
  var match = tagsRegexp.exec(state.buffer);

  // If there is no recognized tag
  if (!match) {
    // If there may be a tag, wait for more data
    if (state.buffer.length < fifoMaxTagLength) { return; }

    // If there cannot be a tag, remove the '<' and recheck
    sendError('PARSE ERR 3: ' + state.buffer.slice(0, fifoMaxTagLength));
    logger.warn('Failed to parse', 'Could not find match', state.buffer.slice(0, fifoMaxTagLength));
    state.buffer = state.buffer.substr(1);
    return;

  // If there is a tag, set the fifoStartTag state
  } else {
    if (fifoTags.indexOf(match[1]) !== -1) { state.tag = match[1]; }

    // If the tag appears invalid, complain but accept it
    if (match.index > 0) { logger.warn('INVALID PLOT MESSAGES RECEIVED: \n' + state.buffer + '\n'); }

    // Eat the tag from the buffer
    state.buffer = state.buffer.substr(tagsRegexp.lastIndex);

    return;
  }
}

function forwardToHandler(tag, msg, handlers) {
  try {
    if (tag === 'PLOT') {
      // FIXME: This is never defined and will throw
      handlers.plot(JSON.parse(msg));
    } else if (tag === 'SERVERMESSAGE') {
      /* eslint-disable */
      var oldNaN = NaN;
      // FIXME: Use JSON.parse instead of eval (this is not simple, as it interfaces Octave)
      var NaN = null;
      var NA = null;
      var Inf = '11e+999';
      var parsedMsg;
      eval('parsedMsg = ' + msg);
      NaN = oldNaN;
      /* eslint-enable */
      handlers.plugin(parsedMsg);
    } else if (tag === 'CLIENTMESSAGE') {
      handlers.clientMessage(JSON.parse(msg));
    } else if (tag === 'RPC') {
      // send echo back to octave
      handlers.rpc(msg);
    }
  } catch (err) {
    handlers.clientError(err);
    // TODO: not necessarily plot error
    // FIXME: This is probably a standin for handle_plot_message
    handlers.clientMessage({
      type: 'plot_error',
      from: 'computer',
      to: 'plot',
      /* eslint-disable camelcase */
      error_message: err.toString(),
      /* eslint-enable camelcase */
    });
  }
}
