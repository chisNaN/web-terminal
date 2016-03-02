var fs = require('fs');
var Promise = require('bluebird');
var oldCounters;

var cpuInfo = fs.readFileSync('/proc/cpuinfo').toString();
var numCpu = 0;

cpuInfo.split('\n').forEach(function (line) {
  if (/^processor/.test(line)) { numCpu += 1; }
});

processUsage(fs.readFileSync('/proc/stat').toString());

module.exports = { get: getCpuUsage };

function getCpuUsage () {
  return new Promise(function(resolve, reject) {
    fs.readFile('/proc/stat', function(err, data) {
      if (err) { return reject(err); }

      var notIdleOverTotal = processUsage(data.toString());
      var usage = notIdleOverTotal * 100 * numCpu;
      resolve(usage);
    });
  });
}

function processUsage (data) {
  var lines = '' + data;
  var line = lines.split('\n')[0];
  var fields = line.split(' ');
  var user = parseInt(fields[2], 10);
  var nice = parseInt(fields[3], 10);
  var sys = parseInt(fields[4], 10);
  var idle = parseInt(fields[5], 10);
  var iowait = parseInt(fields[6], 10);
  var irq = parseInt(fields[7], 10);
  var softirq = parseInt(fields[8], 10);
  var steal = parseInt(fields[9], 10);
  var total = user + nice + sys + idle + iowait + irq + softirq + steal;

  var notIdleOverTotal;
  if (oldCounters !== undefined) {
    var idleDelta = idle - oldCounters.idle;
    var totalDelta = total - oldCounters.total;
    notIdleOverTotal = 1.0 - idleDelta / totalDelta;
    if (totalDelta === 0) {
      notIdleOverTotal = undefined;
    }
  }

  var mycounters = {};
  mycounters.user = user;
  mycounters.nice = nice;
  mycounters.sys = sys;
  mycounters.idle = idle;
  mycounters.iowait = iowait;
  mycounters.irq = irq;
  mycounters.softirq = softirq;
  mycounters.steal = steal;
  mycounters.total = total;

  oldCounters = mycounters;

  return notIdleOverTotal;
}
