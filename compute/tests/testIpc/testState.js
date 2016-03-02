var assert = require('assert');
var fs = require('fs');
var _ = require('underscore');

// Avoid logging from the state module
var logger = require('../../ipc_instance/state/logger');
logger.loggers = null;

var state;
var resetState = function() {
  var statePath = require.resolve('../../ipc_instance/state');
  delete require.cache[statePath];
  state = require(statePath);
};

var tmpPath = '/tmp/ipc_instance.json';
var cache = {};
var oldCLInstance;
var oldTmpInstance;

var cleanPaths = function() {
  try { fs.unlinkSync(tmpPath); } catch(e) {}
};

var testState = { test: 'state', version: 2 };
var testString = JSON.stringify(testState);

before(function() {
  cacheFile(tmpPath);

  function cacheFile(path) {
    try {
      var res = fs.readFileSync(path);
      cache[path] = res;
    } catch(e) {}
  }
});

after(function() {
  for (var path in cache) {
    fs.writeFileSync(path, cache[path]);
  }
});

describe('get', function() {

  describe('with no file', function() {

    before(function() {
      cleanPaths();
      resetState();
    });

    it('should load the default state', function() {
      // Referential equality means the state can be modified through `._default`
      assert.notEqual(state.data, state._default);
      assert.deepEqual(state.data, state._default);
    });
  });

  describe('with tmp', function() {

    before(function() {
      cleanPaths();
      fs.writeFileSync(tmpPath, testString);
      resetState();
    });

    it('should read the state from ' + tmpPath, function() {
      assert.deepEqual(state.data, testState);
    });
  });

  describe('with CL and tmp', function() {

    before(function() {
      cleanPaths();
      fs.writeFileSync(tmpPath, testString);
      resetState();
    });

    it('should read the state from ' + tmpPath, function() {
      assert.deepEqual(state.data, testState);
    });
  });

  describe('versioning', function() {
    var noState = {};
    var v1State = { version: 1, flag: 1 };
    var v2State = { version: 2 };
    var v3State = { version: 3 };

    describe('no version', function() {

      before(function() {
        cleanPaths();
        fs.writeFileSync(tmpPath, JSON.stringify(noState));
        resetState();
      });


      it('should reject the data and use the default', function() {
        assert.deepEqual(state.data, state._default);
      });
    });

    describe('v1', function() {

      before(function() {
        cleanPaths();
        fs.writeFileSync(tmpPath, JSON.stringify(v1State));
        resetState();
      });


      it('should append frames and up the version to the data', function() {
        assert.deepEqual(state.data, { version: 2, frames: {}, flag: 1 });
      });
    });

    describe('v2', function() {

      before(function() {
        cleanPaths();
        fs.writeFileSync(tmpPath, JSON.stringify(v2State));
        resetState();
      });


      it('should read the data', function() {
        assert.deepEqual(state.data, v2State);
      });

    });

    describe('v3', function() {

      before(function() {
        cleanPaths();
        fs.writeFileSync(tmpPath, JSON.stringify(v3State));
        resetState();
      });


      it('should reject the data and use the default', function() {
        assert.deepEqual(state.data, state._default);
      });
    });
  });
});

describe('save', function() {

  before(function() {
    cleanPaths();
    resetState();
  });

  it('should save the state data to disk at ' + tmpPath, function() {
    state.save();
    data = JSON.parse(fs.readFileSync(tmpPath).toString());
    assert.deepEqual(state.data, data);
  });
});

