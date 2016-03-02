var Promise = require('bluebird');
var cpu = require('./cpu');
var mem = require('./mem');

module.exports = getUsage;

function getUsage(cb) {
  Promise.join(null, cpu.get(), mem.get(), cb)
    .catch(cb);
}
