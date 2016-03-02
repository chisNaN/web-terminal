/* jshint -W086 */
var fs = require('fs');
var _ = require('underscore');
var chalk = require('chalk');
var verbosity = require('./verbosity');

module.exports = {
  console: color,
  std: std,
  file: file,
};

function color(prefix) {
  return function() {
    var args = [].slice.call(arguments);
    var color;

    if (this.currentVerbosity === verbosity.TRACE) { color = chalk.black; }
    else if (this.currentVerbosity === verbosity.INFO) { color = chalk.blue; }
    else if (this.currentVerbosity === verbosity.DEBUG) { color = chalk.cyan; }
    else if (this.currentVerbosity === verbosity.WARN) { color = chalk.yellow; }
    else if (this.currentVerbosity === verbosity.ERROR) { color = chalk.red; }
    else { color = chalk.magenta; }

    switch (this.currentVerbosity) {
      case 1:
        color = color.bold;
      case 0:
        color = color.inverse;
      default:
    }

    asciiArgs = args.map(function(arg) {
      return _.isString(arg) ?
      // Color strings according to the verbosity level
        color(arg) :
        arg;
    });

    // Annotate logs with a prefix, if provided
    if (prefix) {
      args.unshift('[' + prefix + ']');
      asciiArgs.unshift(chalk.gray(prefix));
    }

    // Always log to stdout (this is colored by verbosity)
    console.log.apply(console, asciiArgs);

    // Log warnings/errors to stderr as plaintext (this is for logging)
    if (this.currentVerbosity <= verbosity.WARN) { console.error.apply(console, args); }
  };
}

function std(prefix) {
  return function() {
    var args = [].slice.call(arguments);

    if (prefix) { args.unshift('[' + prefix + ']'); }

    if (this.currentVerbosity > verbosity.WARN) { console.log.apply(console, args); }
    else { console.error.apply(console, args); }
  };
}

function file(path) {
  var stream = fs.createWriteStream(path);
  var queue = [];

  var writer = function(msg) { queue.push(msg); };
  stream.on('open', function() {
    while (queue.length) {
      stream.write(queue.shift());
      stream.write('\n');
    }

    writer = stream.write.bind(stream);
  });
    
  return function() {
    var args = [].slice.call(arguments);
    var msg = args.join('\t');
    writer(msg);
    writer('\n');
  };
}

