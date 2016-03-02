var state = require('../../state');
var utils = require('./utils');
var prefetch = require('./prefetch');

module.exports = {
  hello: hello,
  /* eslint-disable camelcase */
  new_frame: newFrame,
  set_frame: setFrame,
  reload_frame: reloadFrame,
  close_frame: closeFrame,
  /* eslint-enable camelcase */
};

function hello(msg) {
  this.sendMessage({
    type: 'set_frames',
    from: 'computer',
    to: msg.from,
    frames: state.data.frames,
  });
}

function newFrame(msg) {
  var id = 1;
  console.log('state.data.frames', state.data.frames);
  while (id in state.data.frames) {
    id++;
  }
  var info = msg.info || {};

  // set frame
  state.data.frames[id] = info;
  state.save();

  this.sendMessage({
    type: 'set_frame',
    from: 'computer',
    to: 'html',
    id: id,
    info: info,
  });

  check.call(this, { id: id, info: info });
}

function setFrame(msg) {
  state.data.frames[msg.id] = msg.info;
  state.save();

  this.sendMessage({
    type: 'set_frame',
    from: 'computer',
    to: 'html',
    id: msg.id,
    info: msg.info,
  });

  check.call(this, msg);
}

function reloadFrame(msg) {
  msg.to = 'html';
  this.sendMessage(msg);

  check.call(this, msg);
}

function closeFrame(msg) {
  delete state.data.frames[msg.id];
  state.save();

  this.sendMessage({
    type: 'close_frame',
    from: 'computer',
    to: 'html',
    id: msg.id,
  });
}

function check(msg) {
  var self = this;
  var xOrigin = msg['x-origin'];
  var url = utils.getUrlFromInfo(msg.info);

  if (xOrigin !== undefined || !url) { return; }

  (new prefetch.Gets(url)).xFrameOptions()
    .then(function(prohibited) {
      msg.info['x-origin'] = prohibited;
      self.sendMessage({
        type: 'prefetch_frame',
        from: 'computer',
        to: 'html',
        id: msg.id,
        info: msg.info,
      });
    });
}
