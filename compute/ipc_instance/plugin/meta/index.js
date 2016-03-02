var fs = require('fs');
var cp = require('child_process');
var exec = require('sync-exec');

module.exports = {
  hello: hello,
  ping: ping,
  /* eslint-disable camelcase */
  save_layout: saveLayout,
  /* eslint-enable camelcase */
  // FIXME: Disable these (security risk)
  execshell: execShell,
  execshellsync: execShellSync,
};

function hello() {
  // note: this can change because of snapshotting!
  var ctid = parseInt(exec('cat /proc/vz/veinfo | awk \'{print $1}\'').stdout);
  this.sendMessage({type: 'ctid', ctid: ctid});
}

function ping(msg) {
  this.sendMessage({
    type: 'ping',
    from: 'computer',
    to: 'meta',
    passback: msg.passback,
    time: msg.time,
    /* eslint-disable camelcase */
    client_id: msg.client_id,
    /* eslint-enable camelcase */
  }, false);
}

function execShell(msg, cb) {
  cp.exec(msg.cmd, msg.options, function(err, stdout, stderr){
    cb(err, stdout, stderr);
  });
}

function execShellSync(msg, cb) {
  var res = exec(msg.cmd);
  cb(res);
}

function saveLayout(msg) {
  fs.writeFile('./CL/cloudlabs_layout.js', 'var Layout = ' + JSON.stringify(msg.layout));
}
