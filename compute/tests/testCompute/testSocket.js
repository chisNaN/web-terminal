var io = require('socket.io-client');
var should = require('should');
var app = require('../../server').app;

var socketURL = 'http://127.0.0.1:8181';
var clientOpts = {
  transports: ['websocket'],
  'force new connection': true
};

function connect() {
  return io.connect(socketURL, clientOpts);
}

describe("Socket Server", function () {
  describe("echo", function () {
    it("should work", function () {
      var client = connect();

      client.on('connect', function (data) {
        client.emit('echo')
      });

      client.on('echo', function (data) {

      });
    });
  });

  describe("message", function () {
    it("should work", function () {
      var client = connect();

      client.on('connect', function (data) {
        client.emit('message')
      });

      client.on('message', function (msg) {

      });
    });
  });

  describe("join", function () {
    it("should work", function () {
      var client = connect();

    });
  });

  describe("disconnect", function () {
    it("should work", function () {
      var client = connect();

    });
  });
});

