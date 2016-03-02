var assert = require('assert');
var _ = require('underscore');
var Promise = require('bluebird');
var utils = require('../../ipc_instance/utils');
var cpu = require('../../ipc_instance/utils/usage/cpu');
var mem = require('../../ipc_instance/utils/usage/mem');

describe('usage', function() {

  it('should return two numbers', function(done) { // presumably the cpu/mem usage
    utils.usage(function(err, cpu, mem) {
      if (err) { done(err); }

      assert(_.isNumber(cpu));
      assert(_.isNumber(mem));
      done();
    });
  });

  describe('cpu.get failing', function() {
    var errVal = {};
    var old;

    before(function() {
      old = cpu.get;
      cpu.get = function() { return Promise.reject(errVal); };
    });

    after(function() { cpu.get = old; });

    it('should propagate the error', function(done) {
      utils.usage(function(err) {
        assert.strictEqual(err, errVal);
        done();
      });
    });
  });

  describe('mem.get failing', function() {
    var errVal = {};
    var old;

    before(function() {
      old = mem.get;
      mem.get = function() { return Promise.reject(errVal); };
    });

    after(function() { mem.get = old; });

    it('should propagate the error', function(done) {
      utils.usage(function(err) {
        assert.strictEqual(err, errVal);
        done();
      });
    });
  });

  describe('cpu.get', function() {

    it('should return a number between 0 and 100 or NaN', function(done) {
      cpu
        .get()
        .then(function(usage) {
          assert(_.isNumber(usage));
          assert(usage >= 0 || _.isNaN(usage));
          assert(usage <= 100 || _.isNaN(usage));
          done();
        })
        .catch(done);
    });
  });

  describe('mem.get', function() {

    it('should return a number greater than 0', function(done) {
      mem
        .get()
        .then(function(usage) {
          assert(_.isNumber(usage));
          assert(usage > 0);
          done();
        })
        .catch(done);
    });
  });
});
