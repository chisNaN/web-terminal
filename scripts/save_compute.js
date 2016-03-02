#!/opt/web-terminal/sbin/n/bin

/* eslint-disable no-process-exit */
var http = require('http');

var options = {
  socketPath: './nginx.sock',
  path: '/save',
  method: 'POST',
};

http
  .request(options, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() { succeed(data); });
    res.on('error', fail);
  })
  .on('error', fail)
  .end();

function fail(error) {
  console.error(error);
  process.exit(1);
}

function succeed(data) {
  console.log('Compute saved: %s', data);
  process.exit(0);
}
