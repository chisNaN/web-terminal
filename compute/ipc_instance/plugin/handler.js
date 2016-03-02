var EventEmitter = require('events').EventEmitter;
var util = require('util');
var log = require('../log');

var logger = new log.Log(log.logger.console('PluginHandler'));

util.inherits(PluginHandler, EventEmitter);
PluginHandler.prototype.on = augmentMethod('on');
PluginHandler.prototype.once = augmentMethod('once');
PluginHandler.prototype.emit = emit;

module.exports = { PluginHandler: PluginHandler };

function PluginHandler(send, sendMessage, sendError) {
  EventEmitter.call(this);

  if (send) {
    this._send = send;
    this._sendError = send;
    this._sendMessage = send.bind(null, null);
  } else {
    this._sendMessage = sendMessage = sendMessage || noop;
    sendError = sendError || noop;
    this._send = function(err) {
      if (err) { return sendError(err); }

      var args = [].slice.call(arguments, 1);
      sendMessage.apply(null, args);
    };
  }
}

function augmentMethod(method) {
  // Namespace is currently only used for the hello handler
  return function(namespace, event, handler) {
    var self = this;
    // FIXME: One-off until namespaces are implemented
    if (event === 'hello') { event += '.' + namespace; }

    logger.debug('Handler bound to event:', event);
    logger.trace('Handler:', handler.toString());

    contextualizedHandler.fn = handler;

    EventEmitter.prototype[method].call(self, event, contextualizedHandler);
    return contextualizedHandler;

    function contextualizedHandler(message, cb) {
      try {
        var context = {
          send: self._send,
          sendMessage: self._sendMessage,
          sendError: self._sendError,
          fn: handler,
        };
        // Restrict signature to one message, as originating client sockets only send one object
        handler.call(context, message, cb);
      } catch (err) {
        self._send(err);
      }
    }
  };
}

// Restrict signature to one message, as originating client sockets only send one object
function emit(event, message) {
  var self = this;
  var cb = function() {/* noop */};

  // FIXME: One-off until namespaces are implemented
  if (event === 'hello') {
    var namespace = message.from.split('.')[0];
    if (namespace === 'computer') { return logger.debug('Skipping hello event from computer'); }

    event += '.' + message.from.split('.')[0];
  }
  if (message && message.cb) {
    cb = function() {
      self._sendMessage({
        from: 'computer',
        to: message.from,
        type: 'callback',
        id: message.cb,
        arguments: [].slice.call(arguments),
      });
    };
  }

  logger.debug('Emitting event:', event);
  logger.trace('Emitting message', message);

  var heard = EventEmitter.prototype.emit.call(self, event, message, cb);
  if (!heard) { logger.debug('There were no listeners for the event'); }
}

function noop() {/* noop */}
