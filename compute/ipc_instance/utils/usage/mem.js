var fs = require('fs');
var Promise = require('bluebird');
var reg = new RegExp('([^:]+):\\s+([0-9]+) kB');

module.exports = { get: getMemUsage };

function getMemUsage() {
  return new Promise(function(resolve, reject) {
    fs.readFile('/proc/meminfo', function(err, data) {
      if (err) { return reject(err); }

      var memInfo = data.toString();
      var memTotal;
      var memFree;
      var memUsage;

      // TODO: Break out of loop once (memTotal && memFree)
      memInfo.split('\n').forEach(function (line) {
        var match = line.match(reg);
        if (match) {
          var key = match[1];
          var value = match[2];

          if (key === 'MemTotal') {
            memTotal = parseInt(value, 10);
          } else if (key === 'MemFree') {
            memFree = parseInt(value, 10);
          }
        }
      });

      memUsage = (memTotal - memFree) * 1024;
      resolve(memUsage);
    });
  });
}
