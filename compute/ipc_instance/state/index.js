var fs = require('fs');
var exec = require('sync-exec');
var logger = require('./logger');

// Paths to check, in order
var paths = ['/tmp/ipc_instance.json'];

// Version conversions
var versionChain = {
  1: function(data) {
     data.version = 2;
     data.frames = {};
     return [true, data];
  },
  2: function(data) {
     return [false, data];
  }
};

// Default state (in a function to prevent referential equality with data.state)
var getDefaultState = function() {
  return {
    version : 2,
    files_open : {}, // path -> t/f
    redraw_message: null,
    watched_path : '/home',
    frames: {} // id -> {url: }
  };
};

State.prototype.load = load;
State.prototype.save = save;

// Create a new state
var state = new State(paths, getDefaultState());

module.exports = {
  data: state.data,
  save: state.save.bind(state),
  _default: getDefaultState(),
};

function State(paths, dflt) {
  var self = this;
  self._path = paths[0];

  self.load(paths, function(err, data) {
    if (err) {
      logger.debug('Loading default state');
      self.data = dflt;
    }
    else { self.data = data; }
    self.loaded = true;
  });
}

function load(paths, cb) {
  var pathIx = 0;
  var savePath = paths[pathIx];

  // Find the first valid path, if any
  while (savePath && !fs.existsSync(savePath)) {
    savePath = paths[++pathIx];
  }

  if (!savePath) {
    logger.warn('Save state file not found');
    return cb(true);
  }

  logger.debug('Loading saved state:', savePath);
  // Back up the savePath
  exec('cp ' + savePath + ' ' + this._path + '.bak');

  // Load the savePath
  try {
    // Read the saved state
    var data = JSON.parse(fs.readFileSync(savePath));
    var bump;
    var version;

    // Convert to the latest version
    if (data.version in versionChain) {
      while (data.version in versionChain) {
        version = versionChain[data.version](data);
        bump = version[0];
        data = version[1];
        if (!bump) {
          logger.info('Loaded saved state:', savePath);
          return cb(null, data);
        }
      }
    } else {
      logger.error(new Error('Version ' + data.version + ' not in versionChain for ' + savePath));
      return cb(true);
    }
  } catch(e) {
    logger.error('Failed to load saved state:', savePath);
    logger.error(e);
    return cb(true);
  }
}

function save() {
  if (!this.loaded) {
    logger.warn('State is not yet loaded', 'Cannot save file until it is loaded');
    return;
  }

  var serialization = JSON.stringify(this.data);
  // FIXME: Do not use synchronous operation
  logger.debug('Saving state:', this._path);
  try {
    fs.writeFileSync(this._path, serialization);
    logger.debug('Saved state:', this._path);
  } catch(e) {
    logger.error('Failed to save state');
    logger.error(e);
  }
}
