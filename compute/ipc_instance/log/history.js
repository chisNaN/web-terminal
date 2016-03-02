/* jshint -W086 */

var fs = require('fs');
var path = require('path');

History.prototype.on = on;
History.prototype.off = off;
History.prototype.log = log;
History.prototype.clear = clear;

module.exports = {
  History: History,
};

function History(filepath) {
  this.filepath = filepath;
  this.logging = false;
  this._queue = [];
  // These will be set by drain.call
  this._stream = null;
  this._logger = null;

  drain.call(this);
}

function on() {
  this.logging = true;
  return this;
}

function off() {
  this.logging = false;
  return this;
}

function log(msg) {
  if (!arguments.length) { return this; }
  if (arguments.length > 1) { msg = [].slice.call(arguments); }
  msg = JSON.stringify(msg);
  this._logger(msg);
  return this;
}

function clear() {
  var self = this;
  self._queue = [];

  queue.call(self);
  if (self._stream) { self._stream.close(); }

  // Delete the old file
  fs.unlink(self.filepath, function() {
    fs.mkdir(path.dirname(self.filepath), drain.bind(self));
  });

  return this;
}

function drain() {
  var self = this;
  var stream = self._stream = fs.createWriteStream(self.filepath, { flags: 'a' });
  queue.call(self);

  stream.on('open', function() {
    while (self._queue.length) {
      stream.write(self._queue.shift());
      stream.write('\n');
    }

    self._logger = function(msg) {
      if (self.logging) {
        stream.write(msg);
        stream.write('\n');
      }
    };
  });
}

function queue() {
  var self = this;
  self._logger = function(msg) {
    if (self.logging) { self._queue.push(msg); }
  };
}
