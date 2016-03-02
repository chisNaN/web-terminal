var assert = require('assert');
var _ = require('underscore');
var utils = require('../../ipc_instance/fifo/utils');

describe('extractStartTag', function() {
  var state;

  describe('Empty buffer', function() {

    beforeEach(setState({ buffer: '' }));

    itShouldReturnAnEmptyBuffer();

    itShouldNotCallTheCallback();
  });

  describe('Buffer without a \'<\'', function() {

    beforeEach(setState({ buffer: 'invalid' }));

    itShouldReturnAnEmptyBuffer();

    it('should call the callback with \'PARSE ERR 1\'', function(done) {
      utils.extractStartTag(state, function(err) {
        assert(/^PARSE ERR 1/.test(err));
        done();
      });
    });
  });

  describe('Buffer with an incomplete tag', function() {

    beforeEach(setState({ buffer: '<' }));

    it('should return an unmodified buffer', function() {
      utils.extractStartTag(state, noop);
      assert.deepEqual(state, { buffer: '<' });
    });

    itShouldNotCallTheCallback();
  });

  describe('Buffer with an incorrect tag', function() {

    beforeEach(setState({ buffer: '<INVALIDLONGTAG>' }));

    it('should return a buffer cycled by one character', function() {
      utils.extractStartTag(state, noop);
      assert(state, { buffer: 'INVALIDLONGTAG>' });
    });

    it('should call the callback with \'PARSE ERR 3\'', function(done) {
      utils.extractStartTag(state, function(err) {
        assert(/^PARSE ERR 3/.test(err));
        done();
      });
    });
  });

  describe('Buffer with a correct tag', function() {

    describe('at front of buffer', function() {

      beforeEach(setState({ buffer: '<SERVERMESSAGE>\ndata' }));

      it('should return a buffer cycled through the tag and the tag', function() {
        utils.extractStartTag(state, noop);
        assert(state, { buffer: 'data', tag: 'SERVERMESSAGE' });
      });

      itShouldNotCallTheCallback();
    });

    describe('not in front of buffer', function() {

      beforeEach(setState({ buffer: 'data<SERVERMESSAGE>\ndata' }));

      it('should return a buffer cycled through the tag and the tag', function() {
        utils.extractStartTag(state, noop);
        assert(state, { buffer: 'data', tag: 'SERVERMESSAGE' });
      });

      it('should call the callback with \'PARSE ERR 2\'', function(done) {
        utils.extractStartTag(state, function(err) {
          assert(/^PARSE ERR 2/.test(err));
          done();
        });
      });
    });
  });

  function setState(obj) { return function() { state = _.clone(obj); }; }

  function itShouldReturnAnEmptyBuffer() {
    it('should return an empty buffer', function() {
      utils.extractStartTag(state, noop);
      assert.deepEqual(state, { buffer: '' });
    });
  }

  function itShouldNotCallTheCallback() {
    it('should not call the callback', function(done) {
      utils.extractStartTag(state, done);
      done();
    });
  }
});

describe('forwardToHandler', function() {
  // NOTE: If parsing of the message becomes more complex, it should be tested
  var msg = '{}';

  describe('PLOT message', function() {
    it('should call clientError and clientMessage', function(done) { // due to an unimplemented method
      var called = {};

      utils.forwardToHandler('PLOT', msg, {
        plugin: function() { done(new Error()); },
        rpc: function() { done(new Error()); },
        clientMessage: function() {
          called.message = true;
          if (called.error) { done(); }
        },
        clientError: function() {
          called.error = true;
          if (called.message) { done(); }
        },
      });
    });
  });
  describe('SERVERMESSAGE message', function() {
    it('should call clientError and clientMessage', function(done) { // due to an unimplemented method
      utils.forwardToHandler('SERVERMESSAGE', msg, {
        plugin: function() { done(); },
        rpc: function() { done(new Error()); },
        clientMessage: function() { done(new Error()); },
        clientError: function() { done(new Error()); },
      });
    });
  });
  describe('CLIENTMESSAGE message', function() {
    it('should call clientError and clientMessage', function(done) { // due to an unimplemented method
      utils.forwardToHandler('CLIENTMESSAGE', msg, {
        plugin: function() { done(new Error()); },
        rpc: function() { done(new Error()); },
        clientMessage: function() { done(); },
        clientError: function() { done(new Error()); },
      });
    });
  });
  describe('RPC message', function() {
    it('should call clientError and clientMessage', function(done) { // due to an unimplemented method
      utils.forwardToHandler('RPC', msg, {
        plugin: function() { done(new Error()); },
        rpc: function() { done(); },
        clientMessage: function() { done(new Error()); },
        clientError: function() { done(new Error()); },
      });
    });
  });
});

function noop() {/* noop */}
