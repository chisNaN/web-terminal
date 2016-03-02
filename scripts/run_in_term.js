#!/opt/web-terminal/sbin/n/bin

var fs = require('fs');
var content = '';
process.stdin.resume();
process.stdin.on('data', function(buf) { content += buf.toString(); });
process.stdin.on('end', function() {
  var message = {
    type: 'write_to_term',
    data: content,
  }

  var msg = '';
  msg += '<SERVERMESSAGE>\n';
  msg += JSON.stringify(message);
  msg += '<ENDSERVERMESSAGE>\n';

  var stream = fs.createWriteStream('/opt/web-terminal/local/node.fifo');
  stream.once('open', function(fd) {
    stream.write(msg);
    stream.end();
    return process.exit(0);
  });
  stream.on('error', function(e) {
    console.log("STREAM ERROR", e);
    stream.end();
    return process.exit(1);
  });
});
