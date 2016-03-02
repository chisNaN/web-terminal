var assert = require('assert');
var fs = require('fs');
var sha3 = require('sha3');
var file = require('../../ipc_instance/file');

// Note: these tests may fail non-deterministically based on the local implementation of fs.watch
describe('file', function() {
  // Fixtures cannot be committed, as they will be updated through the test suite
  var fixturePath = './local/test/fixture.txt';
  var fixtureDir = './local/test';
  var touch = function(filepath, done) { fs.utimes(filepath, Date.now(), Date.now(), done); };
  var digest;

  before(function() {
    // Create the test file if it does not yet exist
    try {
      fs.mkdirSync(fixtureDir);
      fs.writeFileSync(fixturePath, 'Hello, world!');
    } catch (err) {}

    var contents = fs.readFileSync(fixturePath);
    var hash = new sha3.SHA3Hash();

    hash.update(contents);
    digest = hash.digest('hex');
  });

  it('should be an object', function() {
    assert(file instanceof Object);
  });

  describe('hash', function() {
    before(function() { fs.writeFileSync(fixturePath, 'Hello, world!'); });

    it('should fail if the path is not a file', function(done) {
      // Attempt (unsuccessfully) to read cwd
      file.hash('.', function(err) {
        assert(err);
        done();
      });
    });

    it('should match a sha3 fixture', function(done) {
      file.hash(fixturePath, function(err, fileDigest) {
        assert.ifError(err);
        assert.equal(digest, fileDigest);
        done();
      });
    });
  });

  describe('UniqueWatcher', function() {
    var watcher;

    before(function() { watcher = new file.UniqueWatcher(); });
    // Avoid residual watchers
    afterEach(function() { watcher.close(); });

    it('should start with no path/watcher', function() {
      assert.equal(watcher.path, null);
      assert.equal(watcher.watcher, null);
    });

    describe('modifying watchers', function() {
      var notice;

      beforeEach(function(done) {
        notice = function() { /*noop*/ };
        watcher.watch(
          fixturePath,
          function(filename, hash) { notice(filename, hash); },
          function(err) {
            done(err);
          }
        );
      });

      describe('watch', function() {

        it('should store the path & watcher', function() {
          assert.equal(watcher.path, fixturePath);
          // node does not expose the FSWatcher class
          assert.equal(watcher.watcher.constructor.name, 'FSWatcher');
        });

        it('should notice changes on its watcher', function(done) {
          notice = function(filename, hash) {
            // Check for the absolute path
            assert.equal(filename, fixturePath);
            assert.equal(hash, digest);
            done();
          };

          touch(fixturePath, assert.ifError);
        });

        describe('replacing a watcher', function() {
          var newNotice;

          beforeEach(function(done) {
            newNotice = function() { /*noop*/ };
            watcher.watch(
              fixtureDir,
              function(filename, hash) { newNotice(filename, hash); },
              done
            );
          });

          it('should change the path & watcher', function() {
            assert.equal(watcher.path, fixtureDir);
            assert.equal(watcher.watcher.constructor.name, 'FSWatcher');
          });

          it('should not notice changes on the old path', function(done) {
            notice = function(filename) {
              done(new Error('Noticed a change on ' + filename));
            };

            touch(fixturePath, assert.ifError);
            setImmediate(done);
          });

          it('should notice changes on the new path', function(done) {
            newNotice = function() {
              newNotice = function() { /*noop*/ };
              done();
            };

            // There is a 100-second throttle
            setTimeout(touch(fixtureDir, assert.ifError), 100);
          });
        });

        describe('watching a directory', function() {
          var newNotice;

          beforeEach(function(done) {
            newNotice = function() { /*noop*/ };
            watcher.watch(
              fixtureDir,
              function(filename, hash) { newNotice(filename, hash); },
              done
            );
          });

          it('should notice changes on its watcher', function(done) {
            newNotice = function(filename, hash) {
              newNotice = function() { /*noop*/ };
              assert.equal(filename, fixtureDir);
              assert.equal(hash, undefined);
              done();
            };

            touch(fixtureDir, assert.ifError);
          });
        });
      });

      describe('close', function() {

        beforeEach(function() { watcher.close(); });

        it('should clear the path & watcher', function() {
          assert.equal(watcher.path, null);
          assert.equal(watcher.watcher, null);
        });

        it('should not notice changes after being closed', function(done) {
          notice = function(filename) {
            done(new Error('Noticed a change on ' + filename));
          };

          touch(fixturePath, assert.ifError);
          setImmediate(done);
        });

        it('should not err without a watcher', function() {
          watcher.close();
        });
      });
    });
  });

  describe('Watchers', function() {
    var watcher;

    beforeEach(function() { watcher = new file.Watchers(); });
    afterEach(function() { watcher.closeAll(); });

    it('should start with no paths nor watchers', function() {
      assert.equal(
        JSON.stringify(watcher.watchers),
        '{}'
      );
    });

    describe('modifiying watchers', function() {
      var notice;

      beforeEach(function(done) {
        notice = function() { /*noop*/ };

        watcher.watch(
          fixturePath,
          function(filename, hash) { notice(filename, hash); },
          function() { done(); }
        );
      });

      describe('watch', function() {

        it('should store the path & watcher', function() {
          assert(fixturePath in watcher.watchers);
          // node does not expose the FSWatcher class
          assert.equal(watcher.watchers[fixturePath].constructor.name, 'FSWatcher');
        });

        it('should notice changes on its watcher', function(done) {
          notice = function(filename, hash) {
            // Check for the absolute path
            assert.equal(filename, fixturePath);
            assert.equal(hash, digest);
            done();
          };

          touch(fixturePath, assert.ifError);
        });

        describe('replacing a watcher', function() {
          var newNotice;

          beforeEach(function(done) {
            newNotice = function() { /*noop*/ };
            watcher.watch(
              fixturePath,
              function(filename, hash) { newNotice(filename, hash); },
              done
            );
          });

          it('should not notice changes on the old watcher', function(done) {
            notice = function(filename) {
              done(new Error('Noticed a change on ' + filename));
            };

            touch(fixturePath, assert.ifError);
            setImmediate(done);
          });

          it('should notice changes on the new watcher', function(done) {
            newNotice = function() {
              newNotice = function() { /*noop*/ };
              done();
            };

            // There is a 100-second throttle
            setTimeout(touch(fixturePath, assert.ifError));
          });
        });

        describe('adding a watcher', function() {
          var newNotice;

          beforeEach(function(done) {
            newNotice = function() { /*noop*/ };
            watcher.watch(
              fixtureDir,
              function(filename) { newNotice(filename); },
              done
            );
          });

          it('should notice changes on the old path', function(done) {
            notice = function() { done(); };
            touch(fixturePath, assert.ifError);
          });

          it('should notice changes on the new path', function(done) {
            newNotice = function() {
              newNotice = function() { /*noop*/ };
              done();
            };

            // There is a 100-second throttle
            setTimeout(touch(fixtureDir, assert.ifError), 100);
          });
        });

        describe('watching a directory', function() {
          var newNotice;

          beforeEach(function(done) {
            newNotice = function() { /*noop*/ };
            watcher.watch(
              fixtureDir,
              function(filename, hash) { newNotice(filename, hash); },
              done
            );
          });

          it('should notice changes on its watcher', function(done) {
            newNotice = function(filename, hash) {
              newNotice = function() { /*noop*/ };
              assert.equal(filename, fixtureDir);
              assert.equal(hash, undefined);
              done();
            };

            touch(fixtureDir, assert.ifError);
          });
        });
      });

      describe('close', function() {

        beforeEach(function() { watcher.close(fixturePath); });

        it('should clear the path & watcher', function() {
          assert(!(fixturePath in watcher.watchers));
        });

        it('should not notice changes after being closed', function(done) {
          notice = function(filename) {
            done(new Error('Noticed a change on ' + filename));
          };

          touch(fixturePath, assert.ifError);
          setImmediate(done);
        });

        it('should not err without a watcher', function() {
          watcher.close(fixturePath);
        });
      });

      describe('closeAll', function() {

        beforeEach(function() { watcher.closeAll(); });

        it('should clear all paths & watchers', function() {
          assert.equal(
            JSON.stringify(watcher.watchers),
            '{}'
          );
        });
      });
    });
  });
});

