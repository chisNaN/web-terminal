var path = require('path');
var fs = require('fs');
var exec = require('sync-exec');
var state = require('../../state');
var file = require('../../file');
var log = require('../../log');

var logger = new log.Log(log.logger.console('Editor'));
var filesWatcher = new file.Watchers(new log.Log(log.logger.console('editor')));

module.exports = {
  hello: hello,
  /* eslint-disable camelcase */
  contents_check: contentsCheck,
  /* eslint-enable camelcase */
  put: put,
  open: open,
  close: close,
};

function hello(msg) {
  var sendMessage = this.sendMessage;

  for (var filepath in state.data.files_open) {
    filesWatcher.watch(filepath, fileWatcherFn.bind(this));

    sendMessage({
      type: 'open',
      from: 'computer',
      to: msg.from,
      hello: true,
      passback: 0,
      path: filepath,
      result: TryOpen(filepath, true, true),
      /* eslint-disable camelcase */
      dont_show: true,
      /* eslint-enable camelcase */
      reload: false,
    });
  }

  sendMessage({
    type: 'closeallnot',
    from: 'computer',
    to: msg.from,
    paths: state.data.files_open,
  });
}

function contentsCheck(msg) {
  var sendMessage = this.sendMessage;

  file.hash(msg.path, function(err, hash) {
    if (err) { return logger.error(err); }

    sendMessage({
      type: 'contents_check',
      from: 'computer',
      to: 'editor',
      path: msg.path,
      hash: hash,
      /* eslint-disable camelcase */
      client_id: msg.client_id,
      /* eslint-enable camelcase */
    });
  });
}

function put(msg) {
  var self = this;
  if (msg.is_dir) {
    // does this ever happen?
    exec('mkdir -p "' + msg.path + '"');
    // fs.mkdir(msg.path); // mode?
  } else {
    // logger.debug('SAVING FILE', msg.path)

    exec('mkdir -p "' + path.dirname(msg.path) + '"');
    fs.writeFile(msg.path, msg.value, function(err) {
      if (err) {
        return self.send('Write error: ' + err);
      }

      file.hash(msg.path, function(err, hash) {
        if (err) {
          logger.debug(err);
          return;
        }

        self.send(null, {
          type: 'contents_check',
          from: 'computer',
          to: 'editor',
          passback: msg.passback,
          path: msg.path,
          hash: hash,
        });
      });
    });
  }
}

function open(msg) {
  var res = TryOpen(msg.path, msg.force);
  this.sendMessage({
    type: 'open',
    from: 'computer',
    to: 'editor',
    passback: msg.passback,
    path: msg.path,
    result: res,
    /* eslint-disable camelcase */
    loading_id: msg.loading_id,
    /* eslint-enable camelcase */
    reload: msg.reload,
    /* eslint-disable camelcase */
    client_id: msg.client_id,
    /* eslint-enable camelcase */
  });

  // console.log('open command gotten, res:', res)
  // watch AFTER opening
  if (res.contents !== undefined) {
    filesWatcher.watch(msg.path, fileWatcherFn.bind(this));
    state.data.files_open[msg.path] = true;
    state.save();
  }
}

function close(msg) {
  closeEditorFile(msg.path);
  this.sendMessage({
    type: 'close',
    from: 'computer',
    to: 'editor',
    passback: msg.passback,
    path: msg.path,
    /* eslint-disable camelcase */
    client_id: msg.client_id,
    /* eslint-enable camelcase */
  });
}

// Internal functions
function fileWatcherFn(filepath, hash) {
  logger.debug(filepath);
  this.sendMessage({
    type: 'contents_check',
    from: 'computer',
    to: 'editor',
    hash: hash,
    path: filepath,
  });
}

function TryOpen(filepath, force, hello) {
  try {
    var msg;
    var exists = fs.existsSync(filepath);
    if (!exists) {
      if ((!force) || hello) {
        msg = [
          'The file',
          filepath,
          ' doesn\'t exist.',
          'Are you sure you want to open?',
          'If you do, a blank file will be created.',
        ].join(' ');
        /* eslint-disable camelcase */
        return { force_prompt: msg };
        /* eslint-enable camelcase */
      }
    }

    if (!force) {
      var errors = [];
      var res = exec('file -i -b "' + filepath + '"');
      if (res.code === 0) {
        var type = res.stdout.split(';')[0];
        if ((type.split('/')[0] !== 'text')
            && (type.split('/')[1] !== 'x-empty')) {
          errors.push( 'This is not a text file.');
        }
      } else {
        logger.debug('error using file command?' + filepath);
      }

      // var res = exec('ls -lah ' + filepath + ' | awk \'{print $5}\'');
      res = exec('wc -c "' + filepath + '"');
      if (res.code === 0) {
        var size = parseInt(res.stdout.split(' ')[0]);
        // size in bytes.
        if (size > (1024 * 1024)) {
          errors.push('This file is large.');
        }
      } else {
        logger.debug('error using wc?' + filepath);
      }

      if (errors.length) {
        errors.push('Are you sure you want to open?');
        msg = errors.join('\n');
        /* eslint-disable camelcase */
        return { force_prompt: msg };
        /* eslint-enable camelcase */
      }
    }

    if (exists) {
      return {contents: fs.readFileSync(filepath, 'utf8')};
    } else {
      var contents = '';
      exec('mkdir -p ' + filepath.split('/').slice(0, -1).join('/'));
      fs.writeFileSync(filepath, contents);
      return {contents: contents};
    }
  } catch (e) {
    return {error: 'Could not open ' + filepath + ' e' + e};
  }
}

function closeEditorFile(filepath) {
  filesWatcher.close(filepath);
  delete state.data.files_open[filepath];
  state.save();
}
