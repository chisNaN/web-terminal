var fs = require('fs');
var cp = require('child_process');
var state = require('../../state');
var file = require('../../file');
var log = require('../../log');

var logger = new log.Log(log.logger.console('FileBrowser'));
var pathWatcher = new file.UniqueWatcher(logger);

module.exports = {
  hello: hello,
  list: list,
  remove: remove,
  copy: copy,
  move: move,
  uncompress: uncompress,
  find: find,
};

function hello(msg, cb) {
  sendList.call(this, state.data.watched_path, msg.from, 'main', null, false, cb);
}

function list(msg, cb) {
  sendList.call(this, msg.path, msg.from, msg.passback, msg.clientId, false, cb);
}

function remove(msg) {
  var self = this;
  if (msg.is_dir) {
    // FIXME: Use node, not cp
    cp.exec('rm -rf "' + msg.path + '"', function(err) {
      if (err) { self.sendError(err.message); }
      self.sendMessage({
        type: 'hide_loading',
        from: 'computer',
        to: 'files',
        /* eslint-disable camelcase */
        loading_id: msg.loading_id,
        /* eslint-enable camelcase */
      });
    });
  } else {
    fs.unlink(msg.path, function(err) {
      if (err) { self.sendError(err.message); }
      self.sendMessage({
        type: 'hide_loading',
        from: 'computer',
        to: 'files',
        /* eslint-disable camelcase */
        loading_id: msg.loading_id,
        /* eslint-enable camelcase */
      });
    });
  }
}

function copy(msg) {
  var self = this;
  // fs.copy(msg.old_path, msg.new_path, function(err)
  cp.exec('cp -R "' + msg.old_path + '" "' + msg.new_path + '"', function(err) {
    if (err) { self.sendError(err.message); }
    self.sendMessage({
      type: 'hide_loading',
      from: 'computer',
      to: 'files',
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      /* eslint-enable camelcase */
    });
  });
}

function move(msg) {
  var self = this;
  fs.move(msg.old_path, msg.new_path, function(err) {
    if (err) { self.sendError(err.message); }
    self.sendMessage({
      type: 'hide_loading',
      from: 'computer',
      to: 'files',
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      /* eslint-enable camelcase */
    });
  });
}

function uncompress(msg) {
  var self = this;
  var command;
  if (msg.extension === 'zip') {
    //  -o to overwrite
    command = 'unzip "' + msg.path + '" -d "' + msg.dir + '"';
  } else if (['tar.gz', 'tgz'].indexOf(msg.extension) >= 0) {
    command = 'tar xvzf "' + msg.path + '" -C "' + msg.dir + '"';
  } else if (['tar.bz2', 'tbz'].indexOf(msg.extension) >= 0) {
    command = 'tar xvjf "' + msg.path + '" -C "' + msg.dir + '"';
  } else if (msg.extension === 'tar') {
    command = 'tar xvf "' + msg.path + '" -C "' + msg.dir + '"';
  } else {
    throw Error('NOT SURE WHAT TO DO WITH ' + msg.extension);
  }
  cp.exec(command, function(err) {
    if (err) {
      self.sendError(err);
      throw err;
    }
    self.sendMessage({
      type: 'hide_loading',
      from: 'computer',
      to: 'files',
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      /* eslint-enable camelcase */
    });
  });
}

// FIXME: This appears to be dead code
function find(msg) {
  var self = this;
  // var dir = OCTAVE_CWD + msg.path.slice(1);
  var dir = msg.path.slice(1);
  // the i in iname means case insensitive
  var find = cp.spawn('find', [dir, '-iname', '*' + msg.input + '*']);
  var findOutput = '';

  find.stdout.on('data', function(part) {
    findOutput += part;
    var index = findOutput.indexOf('\n');
    while (index >= 0) {
      var file = findOutput.slice(0, index);
      findOutput = findOutput.slice(index + 1);
      var info = getFileInfo(file);
      self.sendMessage({
        type: 'find_result',
        from: 'computer',
        to: 'files',
        info: JSON.stringify(info),
        file: file,
      });
      index = findOutput.indexOf('\n');
    }
  });

  find.stderr.on('data', function(part) {
    self.sendError('FIND ERROR: ' + part);
  });

  find.on('exit', function() {
    self.sendMessage({
      type: 'hide_loading',
      from: 'computer',
      to: 'files',
      /* eslint-disable camelcase */
      loading_id: msg.loading_id,
      /* eslint-enable camelcase */
    });
  });

  // use grep too?
}

function getFileInfo(file) {
  var info = {};
  try {
    var stats = fs.statSync(file);
    /* eslint-disable camelcase */
    info.is_file = stats.isFile();
    info.is_directory = stats.isDirectory();
    /* eslint-enable camelcase */
    info.mtime = stats.mtime;
    info.size = stats.size;
  } catch(e){
    logger.debug('getFileInfo: ' + file + ':' + e);
    return null;
  }
  return info;
}

function sendList(filepath, target, passback, clientId, errorOnly, callback) {
  var self = this;

  fs.exists(filepath, function(exists) {
    if (!exists) { return fail('Directory no longer exists'); }

    fs.readdir(filepath, function(err, files) {
      if (err) { return fail('Failed to readdir:\n' + err); }

      var result = [];
      for (var i in files) {
        var name = files[i];
        if ((name.length > 0) && (name[0] === '.')) { continue; }
        var file = filepath + '/' + name;
        var info = getFileInfo(file);
        if (info) {
          info.name = name;
          result.push(info);
        }
      }
      return success(result);
    });
  });

  function success(result) {
    if (callback) { callback(null, result); }

    if (errorOnly) { return; }
    if (passback === 'main') {
      pathWatcher.watch(
        filepath,
        function listener(filepath) { sendList.call(self, filepath, 'files'); },
        pathWatcherCb.bind(self)
      );
    }

    var mess = {
      type: 'list',
      from: 'computer',
      to: getMessageTarget('files', clientId),  // can't use 'target' since sometimes meta
      passback: passback,
      path: filepath,
      result: JSON.stringify(result),
      clientId: clientId,
    };

    // DON'T LOG THIS!  but need to do the sending optimization
    self.sendMessage(mess, false);
  }

  function fail(err) {
    if (callback) { callback(err); }
    self.sendMessage({
      type: 'list_error',
      to: getMessageTarget('files', clientId),  // can't use 'target' since sometimes meta
      from: 'computer',
      passback: passback,
      path: filepath,
      error: err,
    });
  }

  function getMessageTarget(type, clientId) {
    return clientId ? type + '.' + clientId : type;
  }
}

function pathWatcherCb(err, filepath) {
  if (err) {
    logger.debug(err);

    this.sendMessage({
      type: 'hide_files_list_loading',
      to: 'files',
      from: 'computer',
    });

    return;
  }

  /* eslint-disable camelcase */
  state.data.watched_path = filepath;
  state.save();
  /* eslint-enable camelcase */
}
