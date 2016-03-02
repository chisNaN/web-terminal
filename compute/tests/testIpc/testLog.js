/* jshint -W086 */
/* jshint -W004 */
var assert = require('assert');
var fs = require('fs');
var sinon = require('sinon');
var log = require('../../ipc_instance/log');
var availableLoggers = require('../../ipc_instance/log/logger'); 

describe('log', function() {
  describe('Log', function() {

    describe('loggers', function() {

      it('should default to [logger.console()]', function() {
        var instance = new log.Log();
        assert.equal(instance.loggers.length, 1);
        assert.equal(instance.loggers[0].toString(), log.logger.console().toString());

        var instance = new log.Log(null);
        assert.equal(instance.loggers.length, 1);
        assert.equal(instance.loggers[0].toString(), log.logger.console().toString());
      });

      it('should be an array of passed loggers', function() {
        var instance = new log.Log(1);
        assert.deepEqual(instance.loggers, [1]);

        var loggers = [1, 2, 3, 4, 5];
        instance = new log.Log(loggers);
        assert.equal(instance.loggers, loggers);
      });
    });

    describe('verbosity', function() {

      it('should default to WARN', function() {
        var instance = new log.Log();
        assert.equal(instance.verbosity, log.verbosity.WARN);
      });

      it('should be the passed verbosity', function() {
        var instance = new log.Log(null, log.verbosity.TRACE);
        assert.equal(instance.verbosity, log.verbosity.TRACE);
      });
    }); 

    describe('.setVerbosity', function() {

      it('should change the verbosity', function() {
        var instance = new log.Log();
        instance.setVerbosity(log.verbosity.TRACE);
        assert.equal(instance.verbosity, log.verbosity.TRACE);

        instance.setVerbosity(99);
        assert.equal(instance.verbosity, 99);
      });
    });

    describe('logging methods', function() {
      var loggers = [sinon.spy(), sinon.spy()];
      var instance = new log.Log(loggers);

      describe('error', logMethod('error'));
      describe('warn', logMethod('warn'));
      describe('info', logMethod('info'));
      describe('debug', logMethod('debug'));
      describe('trace', logMethod('trace'));
      describe('log', function() {

        it('should call loggers with the passed verbosity', function() {
        });
      });

      describe('without loggers', function() {
        
        it('should not err', function() {
          var instance = new log.Log();
          instance.loggers = null;
          assert.doesNotThrow(function() {
            instance.error(1, 2, 3);
            instance.warn(1, 2, 3);
            instance.info(1, 2, 3);
            instance.debug(1, 2, 3);
            instance.trace(1, 2, 3);
            instance.log(99, 1, 2, 3);
          });
        });
      });

      function logMethod(verbosity) {
        return function() {

          before(function() {
            instance.setVerbosity(log.verbosity[verbosity.toUpperCase()]);
          });
          beforeEach(function() {
            loggers.forEach(function(logger) { logger.reset(); });
          });

          switch (verbosity) {
            case 'trace':
              checkIf('trace');
            case 'debug':
              checkIf('debug');
            case 'info':
              checkIf('info');
            case 'warn':
              checkIf('warn');
            case 'error':
              checkIf('error');
          }
          switch (verbosity) {
            case 'error':
              checkIfNot('warn');
            case 'warn':
              checkIfNot('info');
            case 'info':
              checkIfNot('debug');
            case 'debug':
              checkIfNot('trace');
          }

          function checkIf(method) {
            it('should log for ' + method, function() {
              instance[method](1, 2, 3);
              loggers.forEach(function(logger) {
                assert(logger.calledOnce);
                assert(logger.calledWithExactly(1, 2, 3));
              });
            });
          }
          function checkIfNot(method) {
            it('should not log for ' + method, function() {
              instance[method]();
              loggers.forEach(function(logger) {
                assert(!logger.called);
              });
            });
          }
        };
      }
    });
  });

  describe('logger', function() {
    var manualTest = function() { console.log('This should be tested manually'); };

    it('should alias available loggers', function() {
      assert.equal(log.logger, availableLoggers);
    });

    describe('console', function() {
      // These must be tested manually
      it('should write colored logs to stdout', manualTest);
      it('should write plaintext logs to stderr', manualTest); 
    });

    describe('std', function() {
      // These must be tested manually
      it('should write logs to stdout/stderr', manualTest); 
    });

    describe('file', function() {
      var path = '/tmp/test/log';

      before(function() {
        try { fs.mkdirSync('/tmp/test'); } catch(e) {}
        try { fs.unlinkSync(path); } catch(e) {}
        // Ensure a file exists from which to create a readStream
        fs.writeFileSync(path);
      });

      it('should write logs to a file', function(done) {
        var coffees = ['Sparkroot', 'Comet', 'Four Barrel'];
        var instance = new log.Log(log.logger.file(path));
        var stream = fs.createReadStream(path);
        var msg = '';

        stream.on('data', function(chunk) {
          msg += chunk.toString();
          if (msg === coffees.join('\t') + '\n') {
            stream.close();
            done();
          }
        });

        instance.error.apply(instance, coffees);
      });
    });
  });
});

