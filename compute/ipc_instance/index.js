/* Does communication with octave, etc.  */

var path = require('path');
var randomstring = require('randomstring');
var fs = require('fs.extra');
var _ = require('underscore');
var utils = require('./utils');
var log = require('./log');
var state = require('./state');
var fifo = require('./fifo');
var plugin = require('./plugin');

var env = process.env.NODE_ENV;
var testPlot = process.env.NODE_PLOT || false;

var localFolder = './local';

// Initialize loggers
var logger = new log.Log(log.logger.console('ipc')); // General
var history = { // Will not write unless it is enabled
  i: new log.History(path.join(localFolder, 'history.i.txt')),
  o: new log.History(path.join(localFolder, 'history.o.txt')),
}; // To log client i/o: history.i.on(), history.o.on();

module.exports = addIpc;

function addIpc(sendMessageToClient, app) {
  logger.debug('Starting up');

  /* eslint-disable camelcase */
  // Expose the message handler
  this.handle_message = handleMessage;
  /* eslint-enable camelcase */

  // Send load statistics every second
  setInterval(sendLoad, 1000);

  // Initialize the plugin handler
  // TODO: Consolidate to one callback function
  var plugins = new plugin.PluginHandler(null, sendMessage, sendError);

  // Load default plugins
  _.each(plugin.plugins, function(plugin, namespace) {
    _.each(plugin, function(handler, event) {
      plugins.on(namespace, event, handler);
    });
  });

  // NOTE: These plugins still require closure
  // TODO: Abstract this out to the meta plugin
  plugins.on('meta', 'save_state', function(msg, cb) { saveState(); cb(); });
  plugins.on('meta', 'log', toggleHistory);
  // TODO: Move to the term/shell plugin
  plugins.on('shell', 'write_to_term', app.writeToTerm);

  // TODO: Migrate this elsewhere - this is express logic
  app.all('/save', function(req, res) {
    saveState();
    return res.send('Success!');
  });

  // Start listening on the fifo
  if (env === 'production' || testPlot) { fifo.start(handleMessage, sendMessage, sendError); }

  // Process listeners
  process.on('disconnect', ondisconnect);
  process.on('uncaughtException', onexception);
  process.on('SIGHUP', onsighup);

  logger.debug('Started up');
  return this;

  function handleMessage(message) {
    if (message.type !== 'ping') { history.i.log(message); } // Record incoming messages
    plugins.emit(message.type, message);
  }

  function sendMessage(message, log, syncMatters) {
    message.to = message.to || 'meta';
    var serialization = JSON.stringify(message);

    if (serialization.length < 10000) {
      sendMessageToClient(message);
    } else {
      syncMatters = syncMatters === undefined ? true : false;

      var id = randomstring.generate(64);
      // TODO: Clean unused files
      var idpath = localFolder + '/' + id + '.json';

      fs.writeFileSync(idpath, serialization);

      sendMessageToClient({
        to: message.to,
        from: message.from,
        type: 'file_message',
        id: id,
        /* eslint-disable camelcase */
        sync_matters: syncMatters,
        /* eslint-enable camelcase */
      });
    }

    if (log !== false) { history.o.log(message); } // Record outgoing messages
  }

  function sendError(err) {
    try {
      var message = err.toString('utf-8');
      logger.error(err, err.Message, err.stack);
      sendMessage({
        type: 'show_error',
        from: 'computer',
        to: 'meta',
        error: message,
      });
    } catch (err) {
      logger.error('Failed to send error', err);
    }
  }

  function sendLoad() {
    utils.usage(function(err, cpu, mem) {
      if (err) { return logger.error('Failed to get cpu/mem usage', err); }

      sendMessage(
        {
          type: 'loadavg',
          from: 'computer',
          to: 'meta',
          result: {
            'cpu': cpu,
            'memory': mem,
          },
        },
        false
      );
    });
  }

  // TODO: Deal with express in another module
  function saveState() {
    // save tty state
    app.SaveState();
    // save everything else
    state.save();
  }

  // TODO: Move to meta namespaced plugin
  function toggleHistory(msg) {
    if (msg.enable) {
      history.i.on();
      history.o.on();
    } else {
      history.i.off();
      history.o.off();
    }

    this.sendMessage({
      type: 'log',
      from: 'computer',
      to: 'meta',
      enable: !!msg.enable,
    }, false);
  }

  function ondisconnect() {
    logger.debug('Disconnected');
  }

  function onexception(err) {
    // TODO: Log this somewhere loud
    sendError(err);
  }

  function onsighup() {
    logger.debug('SIGHUP: saving and exiting');
    saveState();
    process.kill(process.pid)
  }
}
