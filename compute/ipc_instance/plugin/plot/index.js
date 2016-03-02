var http = require('http');
var async = require('async');
var fs = require('fs');
var parser = require('./parser');
var log = require('../../log');
var state = require('../../state');

var logger = new log.Log([ // Plotting
  log.logger.console('octave'),
  log.logger.file('./local/diary.fifo'),
]);

var isPinging = false;
var plotShowing = false;
var numPingsFailed = 0;
var tileQueueCbMapping = {};
var tileQueueCounter = 0;
var tileQConcurrency = 5;
var tileQ = async.queue(tileQProcessor, tileQConcurrency);

var hitCServer = hitServerPort.bind(null, 90);
var hitEvalServer = hitServerPort.bind(null, 91);

var getNextTileRequestId = function() {
  var counter = 0;
  return function() { return counter++; };
}();

module.exports = {
  hello: hello,
  figure: figure,
  closefig: closefig,
  savefig: savefig,
  sharefig: sharefig,
  /* eslint-disable camelcase */
  fetch_plot_tile: makeTileRequest,
  fetch_plot_full: makeFullRequest,
  /* eslint-enable camelcase */
  redraw: redraw,
};

function hello() {
  var message = {};

  // TODO: Prevent flooding of the socket
  if (!isPinging) { isPinging = setInterval(writePing.bind(null, this.sendMessage), 200); }

  if (plotShowing) {
    if (!state.data.redraw_message) { return logger.trace('HELLO: wtf, no redraw message'); }

    logger.trace('SENDING REDRAW MESSAGE BECAUSE OF HELLO');

    message.hello = true;
    for (var k in state.data.redraw_message) { message[k] = state.data.redraw_message[k]; }
  } else {
    message.type = 'no_plot';
    message.to = 'plot';
    message.from = 'computer';
  }

  this.sendMessage(message);
}

// Message Handlers
function figure(msg) {
  // var sendMessage = this.sendMessage;
  var path = '/feval?arg=figure(' + msg.figure_id + ');';
  logger.debug('FIGURE MESSAGE', path);

  hitEvalServer(path, function(data) {
    logger.debug('hit eval successfuly', data);
    // sendMessage({ type: 'hide_loading', from: 'computer', to: msg.from, loading_id: msg.loading_id });
  }, function(e) {
    logger.debug('hit eval error', e);
    // sendMessage({ type: 'hide_loading', from: 'computer', to: msg.from, loading_id: msg.loading_id });
  });
}

function closefig(msg) {
  // var sendMessage = this.sendMessage;
  var path = '/feval?arg=try;close(' + msg.figure_id + ');catch;end;';
  logger.debug('CLOSE FIGURE MESSAGE', path);

  hitEvalServer(path, function(data) {
    logger.debug('hit eval successfuly', data);
    // send_message({ type: 'hide_loading', from: 'computer', to: msg.from, loading_id: msg.loading_id });
  }, function(e) {
    logger.debug('hit eval error', e);
    // send_message({ type: 'hide_loading', from: 'computer', to: msg.from, loading_id: msg.loading_id });
  });
}

function savefig(msg) {
  var sendMessage = this.sendMessage;
  var path = '/figure_request?figure_handle=' + msg.figure_id;

  hitCServer(path,
    function(data) {
      logger.debug('DATA', data);
      var parts = data.split(' ');
      if (parts[0] !== 'FIGURE_AVAILABLE') {
        return fail('bad return value, expected FIGURE_AVAILABLE, got ' + parts[0]);
      }
      var src = parts[1].slice(0, -1);

      fs.move(src, msg.path, function(err) {
        if (err) { return fail('failed to move' + err.toString()); }
        success();
      });
    }, function(e) { fail('failed to hit c server, ' + e); }
  );

  logger.debug('SAVE FIGURE MESSAGE', path);

  function fail(message) {
    // TODO: do something better
    logger.debug('savefig error', message);
    sendMessage({
      type: 'hide_loading',
      from: 'computer',
      to: msg.from,
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      client_id: msg.client_id,
      /* eslint-enable camelcase */
      error: message,
    });
  }

  function success() {
    logger.debug('savefig success');
    sendMessage({
      type: 'hide_loading',
      from: 'computer',
      to: msg.from,
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      client_id: msg.client_id,
      /* eslint-enable camelcase */
    });
  }
}

function sharefig(msg) {
  var sendMessage = this.sendMessage;
  var publicFolder = '/var/www/html';
  var file = msg.id + '.png';
  var dst = publicFolder + '/' + file;

  var path = '/figure_request?figure_handle=' + msg.figure_id;

  hitCServer(path,
    function(data) {
      logger.debug('DATA', data);
      var parts = data.split(' ');
      if (parts[0] !== 'FIGURE_AVAILABLE') {
        return fail('bad return value, expected FIGURE_AVAILABLE, got ' + parts[0]);
      }
      var src = parts[1].slice(0, -1);

      fs.move(src, dst, function(err) {
        if (err) { return fail('failed to move' + err.toString()); }
        success();
      });
    }, function(e) { fail('failed to hit c server, ' + e); }
  );

  logger.debug('SHARE FIGURE MESSAGE', path);

  function fail(message) {
    sendMessage({
      type: 'figure_shared',
      from: 'computer',
      to: msg.from,
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      /* eslint-enable camelcase */
      id: msg.id,
      file: file,
      /* eslint-disable camelcase */
      client_id: msg.client_id,
      /* eslint-enable camelcase */
      error: message,
    });
  }

  function success() {
    sendMessage({
      type: 'figure_shared',
      from: 'computer',
      to: msg.from,
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      /* eslint-enable camelcase */
      id: msg.id,
      file: file,
      /* eslint-disable camelcase */
      client_id: msg.client_id,
      /* eslint-enable camelcase */
    });
  }
}

function makeTileRequest(msg) {
  var sendMessage = this.sendMessage;
  var id = getNextTileRequestId();
  logger.trace('got fetch plot_tile request, id = ' + id);

  msg.id = id;
  msg.counter = tileQueueCounter;
  if (!plotShowing) {
    logger.trace('Tile request made but no plot showing');
    return;
  }
  if (msg.passback.is_prefetch) {
    tileQ.push(msg, onprocess);
  } else {
    tileQ.unshift(msg, onprocess);
  }

  function onprocess(err, result) {
    if (err) {
      logger.error('Failed to process', id);
      return;
    }

    sendMessage(result);
    logger.trace('Finished processing', id);
  }
}

function makeFullRequest(msg) {
  var sendMessage = this.sendMessage;
  var id = getNextTileRequestId();
  logger.trace('got fetch plot_full request, id = ' + id);

  msg.id = id;
  msg.counter = tileQueueCounter;
  if (!plotShowing) {
    logger.trace('Tile request made but no plot showing');
    return;
  }
  tileQ.unshift(msg, onprocess);

  function onprocess(err, result) {
    if (err) {
      logger.error('Failed to process', id);
      return;
    }

    sendMessage(result);
    logger.trace('Finished processing', id);
  }
}

function redraw(msg) {
  var sendMessage = this.sendMessage;
  logger.debug('GOT MESSAGE', msg);
  parser.parse_octave_mat_file(msg.file, function(result) {
    logger.debug('RESULT', JSON.stringify(result));
    plotShowing = true;
    var message = {};
    message.type = 'redraw';
    message.to = 'plot';
    message.from = 'computer';
    /* eslint-disable camelcase */
    message.graphics_object = result;
    /* eslint-enable camelcase */

    sendMessage(message);
    logger.trace('SENDING REDRAW MESSAGE');
    // doesn't truly clear the queue, but invalidates the current tasks
    tileQueueCounter++;
    /* eslint-disable camelcase */
    state.data.redraw_message = message;
    /* eslint-enable camelcase */
    state.save();
  });
}

// Internal functions
function writePing(sendMessage) {
  // TODO: Use exponential backoff
  var path = '/ping';

  hitCServer(path, function() {
    numPingsFailed = 0;
    if (state.data.redraw_message && (!plotShowing) ) {
      plotShowing = true;
      logger.trace('SENDING REDRAW MESSAGE BECAUSE OF PING');
      sendMessage(state.data.redraw_message);
    }
  }, function() {
    numPingsFailed += 1;
    if (plotShowing && (numPingsFailed > 1)) {
      plotShowing = false;
      logger.trace('Failed to ping!  closing plot');
      var msg = {};
      msg.type = 'no_plot';
      msg.to = 'plot';
      msg.from = 'computer';
      sendMessage(msg);
    }
  });
}

function getTile(msg, onSuccess, onFail) {
  var path = '/tile_request?' +
    'id=' + msg.id +
    '&axis_handle=' + msg.handle +
    '&xi=' + msg.xi +
    '&xp=' + msg.xp +
    '&yi=' + msg.yi +
    '&yp=' + msg.yp +
    '&w=' + msg.W +
    '&h=' + msg.H;

  hitCServer(path, function(data) {
    onSuccess();
    var parts = data.slice(0, -1).split(' ');
    // var type = parts[0]; // TILE_AVAILABLE
    var fname = parts[1];
    receivePlotPng(msg.id, fname);
  }, function(e) {
    logger.trace('HTTP ERROR' + e.message + e.stack);
    onFail();
  });
}

function getFull(msg, onSuccess, onFail) {
  var path = '/full_request?' +
    'id=' + msg.id +
    '&axis_handle=' + msg.handle +
    '&w=' + msg.W +
    '&h=' + msg.H;

  hitCServer(path, function(data) {
    onSuccess();
    var parts = data.slice(0, -1).split(' ');
    var type = parts[0]; // TILE_AVAILABLE
    var fname = parts[1];
    logger.trace('FILE NAME, ' + type + ',' + fname);
    receivePlotPng(msg.id, fname);
  }, function(e) {
    logger.trace('HTTP ERROR' + e.message + e.stack);
    onFail();
  });
}

function hitServerPort(port, path, onSuccess, onFail) {
  var tileHost = 'localhost';

  http.request({
    hostname: tileHost,
    port: port,
    path: path,
    method: 'GET',
  }, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) { data += chunk; });
    res.on('end', function() { onSuccess(data); });
  }).on('error', function(e) {
    onFail(e);
  }).end();
}

function finishQueuedTask(id) {
  if (tileQueueCbMapping[id] ) {
    if (tileQueueCbMapping[id].callback) {
      tileQueueCbMapping[id].callback(new Error('Skipping task'));
    } else {
      logger.trace('Task ' + id + ' was missing callback!  This shouldn\'t happen;');
    }
    delete tileQueueCbMapping[id];
  } else {
    logger.trace('Task ' + id + ' not in callback mapping.  Perhaps timed out?');
  }
}

function tileQProcessor(task, callback) {
  if (task.counter !== tileQueueCounter) {
    callback(new Error('Skipping task'));
  } else {
    logger.trace('fetching tile: ' + task.id);
    tileQueueCbMapping[task.id] = {
      type: task.type,
      callback: callback,
      passback: task.passback,
      message: task,
      time: Date.now(),
    };

    logger.trace('queue length: ' + tileQ.length());

    if (task.type === 'fetch_plot_tile') {
      getTile(task, function() {
        logger.trace('Successfully wrote tile_req');
      }, function() {
        logger.trace('Failed to write tile_req');
      });
    } else {
      getFull(task, function() {
        logger.trace('Successfully wrote full_req');
      }, function() {
        finishQueuedTask(task.id);
        logger.trace('Failed to write full_req');
      });
    }

    // If request doesn't come back in 10 seconds, do something about it
    var waitTileTime = 10000;
    setTimeout(function() {
      if (tileQueueCbMapping[task.id]) {
        finishQueuedTask(task.id);
        logger.trace('Waited ' + waitTileTime + 'ms but didn\'t call callback');
      }
    }, waitTileTime);
  }
}


// TILE RECEIVE
function receivePlotPng(id, filename) {
  if (id === undefined) {return logger.error('No id?? Something went very wrong!'); }
  if (!filename) {
    if (tileQueueCbMapping[id] && tileQueueCbMapping[id].callback) {
      tileQueueCbMapping[id].callback(new Error('No filename'));
    }
    return logger.warn('No filename?? Something went wrong!  ID: ' + id );
  }

  var result = {
    // COULD SEND RAW DATA
    // xs: [],
    // ys: [],
    image: filename,
    xticks: [],
    yticks: [],
  };

  var msg = {};
  msg.type = 'plot_tile_fetched';
  msg.to = 'plot';
  msg.from = 'computer';
  msg.result = result;

  var parts = filename.split('/').slice(-1)[0].slice(0, -4).split('_');
  var partsId = parseInt(parts[0]);
  if (partsId !== +id) { logger.trace('IDS DONT MATCH,' + partsId + ' vs ' + id); }

  var req = tileQueueCbMapping[id];
  if (req) {

    if (req.type === 'fetch_plot_tile') {
      msg.handle = parts[1];
      msg.xi = parseInt(parts[2]);
      msg.xp = parseInt(parts[3]);
      msg.yi = parseInt(parts[4]);
      msg.yp = parseInt(parts[5]);
      msg.W = parseInt(parts[6]);
      msg.H = parseInt(parts[7]);
      msg.md5 = filename; // TODO: change this, use an MD5 and put those in the same folder
    } else {
      msg.handle = parts[1];
      msg.W = req.message.W;// parseInt(parts[2]);
      msg.H = req.message.H;// parseInt(parts[3]);
      msg.md5 = filename; // TODO: change this, use an MD5 and put those in the same folder
    }

    msg.passback = req.passback;
    finishQueuedTask(id);
    logger.trace('PASSBACK' + JSON.stringify(msg.passback));
    logger.trace('id: ' + id + ', REQUESTED: ' + req.time + ', FETCHED ' + Date.now());
    req.callback(null, msg);
  } else {
    logger.trace('Request ' + id + ' missing from tile queue callback mapping.  Maybe took too long?');
  }
}

