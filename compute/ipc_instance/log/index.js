var verbosity = require('./verbosity');
var logger = require('./logger');
var history = require('./history');
var defaultLogger = logger.console();

module.exports = {
  Log: Log,
  logger: logger,
  verbosity: verbosity,
  History: history.History,
};

function Log(loggers, newVerbosity) {
  loggers = loggers || defaultLogger;
  if (!Array.isArray(loggers)) { loggers = [loggers]; }

  this.loggers = loggers;
  this.verbosity = newVerbosity === undefined ? verbosity.WARN : newVerbosity;
  this.currentVerbosity = null;
}

// Global verbosity setting
Log.verbosity = verbosity.ERROR;
// Mirror the instance method
Log.setVerbosity = function(newVerbosity) {
  Log.verbosity = newVerbosity;
};

Log.prototype.setVerbosity = function(newVerbosity) {
  this.verbosity = newVerbosity;
};

Log.prototype.error = function() { log.call(this, verbosity.ERROR, arguments); };
Log.prototype.warn = function() { log.call(this, verbosity.WARN, arguments); };
Log.prototype.info = function() { log.call(this, verbosity.INFO, arguments); };
Log.prototype.debug = function() { log.call(this, verbosity.DEBUG, arguments); };
Log.prototype.trace = function() { log.call(this, verbosity.TRACE, arguments); };
Log.prototype.log = function(verbosity) {
  var args = [].slice.call(arguments, 1);
  log.call(this, verbosity, args);
};

function log(verbosity, args) {
  var self = this;

  // Only log if we have loggers
  if (!Array.isArray(self.loggers)) { return; }

  // Instance verbosity settings will be ignored if less than the global verbosity
  if (Math.max(Log.verbosity, self.verbosity) < verbosity) { return; }
  self.currentVerbosity = verbosity;

  self.loggers.forEach(function(logger) {
    // Expose self.currentVerbosity to the logger
    logger.apply(self, args);
  });
  self.currentVerbosity = null;
}

