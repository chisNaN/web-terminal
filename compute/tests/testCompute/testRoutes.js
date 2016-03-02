var request = require('supertest');
var fs = require('fs.extra');
var path = require('path');
var app = require('../../server').app;
var should = require('should');

function withFile(name, content, createCb) {
  fs.writeFile(name, content, function (err) {
    if (err) { throw err; }
    var filepath = path.resolve(name);

    createCb(filepath, function (deleteCb) {
      fs.unlink(name, function (err) {
        if (err) { throw err; }
        deleteCb();
      });
    });
  });
}

function checkFileDownload(requestBasePath, done) {
    var testdata = 'Hello World!';

    withFile('hello.txt', testdata, function (filepath, doneWithFile) {
      request(app)
        .get(requestBasePath + encodeURIComponent(filepath))
        .set('Accept', 'text/plain')
        .expect('Content-Disposition', /attachment/)
        .expect('Content-Length', testdata.length)
        .expect(testdata)
        .expect(200, function (requesterr) {
          doneWithFile(function () { done(requesterr); });
        });
    });
}

describe('GET /', function () {
  it('should respond with html', function (done) {
    request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect(200, done);
  });
});

describe('GET /download/:path', function () {
  it('should respond with the requested file if it is a file', function (done) {
    checkFileDownload('/download/', done);
  });

  it('should zip the directory and send it if it is a directory', function (done) {
    var testDirectoryPath = path.resolve('compute/tests/testCompute/testDirectory');

    request(app)
      .get('/download/' + encodeURIComponent(testDirectoryPath))
      .set('Accept', 'application/zip')
      .expect('Content-Disposition', /attachment/)
      .expect('Content-Type', /zip/)
      .expect(200, done);
  });
});

// This route is DEPRECATED.
describe('GET /execSync', function () {});

