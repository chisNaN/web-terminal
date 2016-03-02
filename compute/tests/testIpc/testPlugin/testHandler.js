var assert = require('assert');
var PluginHandler = require('../../../ipc_instance/plugin/handler').PluginHandler;

/* This only tests those parts of the API that diverge from events.EventEmitter
 * hello handlers are not tested, as they are a temporary case
 */
describe('PluginHandler instance', function() {
  var testSendMessage = noop;
  var testSendError = noop;
  var sendMessage = function() { testSendMessage.apply(null, arguments); };
  var sendError = function(err) {
    if (err instanceof assert.AssertionError) { throw err; }
    testSendError.apply(null, arguments);
  };
  var handler = new PluginHandler(null, sendMessage, sendError);
  var tester = noop;
  var listener = noop;

  beforeEach(function() {
    handler.removeAllListeners('event');
    handler.on('ns', 'event', listener);
  });

  describe('on', function() {

    it('should return the augmented method', function() {
      var augmentedListener = handler.on('ns', 'event', listener);

      assert.equal(augmentedListener.name, 'contextualizedHandler');
      assert.equal(augmentedListener.fn, listener);
    });

    it('should add the augmented method as a listener', function() {
      assert.equal(
        handler.listeners('event')
          .filter(function(augmentedListener) { return augmentedListener.fn === listener; })
          .length,
        1
      );
    });
  });

  describe('emit', function() {

    before(function() { listener = function() { tester.apply(this, arguments); }; });

    beforeEach(function() {
      testSendMessage = noop;
      testSendError = noop;
      tester = noop;
    });

    describe('handler', function() {

      it('should be invoked synchronously', function(done) {
        var finish = function() {};
        tester = function() { finish = done; };
        handler.emit('event');
        finish();
      });

      it('should be invoked with two arguments (msg, cb)', function(done) {
        tester = function() {
          assert(arguments.length === 2);
          assert(arguments[1] instanceof Function);
        };
        handler.emit('event');
        handler.emit('event', {});
        handler.emit('event', {}, {});
        handler.emit('event', {}, {}, {});
        handler.emit('event', { cb: true });
        handler.emit('event', { cb: true }, {});
        handler.emit('event', { cb: true }, {}, {});
        done();
      });

      describe('context', function() {
        var msg = {};
        var err = {};

        it('should be able to pass messages to sendMessage', function(done) {
          tester = function() { this.sendMessage(msg); };
          testSendMessage = function(data) { assert.strictEqual(data, msg); };
          handler.emit('event');
          done();
        });

        it('should be able to pass messages to send', function(done) {
          tester = function() { this.send(err); this.send(null, msg); };
          testSendMessage = function(data) { assert.strictEqual(data, msg); };
          testSendError = function(data) { assert.strictEqual(data, err); };
          handler.emit('event');
          done();
        });

        it('should expose the original listener as fn', function(done) {
          tester = function() { assert.strictEqual(this.fn, listener); };
          handler.emit('event');
          done();
        });
      });
    });
  });
});

function noop() {/* noop */}
