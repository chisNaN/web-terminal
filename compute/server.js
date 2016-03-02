var tty = require('tty.js');
var ipc = require('./ipc_instance');
var package = require('../package.json');

var path = require('path');
var cp = require('child_process');
var fs = require('fs.extra');
var randomstring = require('randomstring');
var exec = require('sync-exec');
var spawn = require('child_process').spawn;
var request = require('superagent');
var uuid = require('node-uuid');
var ua = require('universal-analytics');

var express = require('express');
var morgan = require('morgan');
var constants = require('../constants');

var env = process.env.NODE_ENV;

var chatroom_members = {};
var chatroom_size = 0;

function log_message() {
  console.log.apply(console, arguments);
}

process.on('uncaughtException', function(err) {
  var message = 'UNCAUGHT EXCEPTION IN COMPUTE_SERVER: ' ;
  message += '\n' + err + '\n' + err.Message + '\n' + err.stack + '\n';
  log_message(message);
});

process.on('exit', function() {
  log_message('Process exiting');
});

var conf = {
  'shell': 'su',
  'shellArgs': ['-'],
  'port': 8080
  //
  //'shell': 'screen',
  //'shellArgs': ['octave'],
  //'shellArgs': ['bash'],
  //
  //'shell': 'octave',
  //'shellArgs': ['--silent' ],
  //'limitGlobal': 100,
  //'limitPerUser': Infinity, //5,
  //'syncSession': true,
  //'sessionTimeout': -1,
  //'historyLimit': 500,
  //'cwd': '/',
  //log: true,
  //io: { log: true },
  //debug: true,
  //port: 8080,
};

if (env === 'development') {
  conf.saveDir = '/tmp';
} else {
  conf.saveDir = './CL';
}

var app = tty.createServer(conf);
var port = process.argv[2] || 8181;

//app.use('/files', express['static']('/'));
////app.use('/files', express.directory('/'));
//// for backwards compatibility
//app.use('/home', express['static']('/'));

app.set('showStackError', true);
app.set('views', path.resolve('public'));
app.set('view engine', 'jade');

app.use('/file_download', function(req, res, next) {
  res.attachment();
  return next();
});
app.use('/file_download', express['static']('/')); // jshint ignore:line

if (process.env.NODE_ENV !== 'production') {
  console.log('app use for static');
  app.use('/', express.static(__dirname + '/../'));
  app.use(morgan('dev'));
}
app.use('/', express.static(__dirname + '/../public/'));

app.get('/', function(req, res) {
  res.sendFile('/' + __dirname.split('/').slice(0, -1).join('/') + '/public/index.html');
});

var version = fs.readFileSync(__dirname +'/../version');
app.get('/version', function(req, res) {
  res.send(version)
});

var io = app.io;
io.set('log level', 1);
io.set('origins', '*:*');
io.set('transports', [
  'websocket'
  //, 'flashsocket'
  //, 'htmlfile'
  //, 'xhr-polling'
  //, 'jsonp-polling'
]);

var compute_member = {
};

function SmallStrfy(x) {
  var res = JSON.stringify(x);
  return res.length < 100 ? res : 'big res:' + x.type;
}

compute_member.type = 'childprocess';
compute_member.name = 'computer';
compute_member.pipe = ipc(function(message) {
  if((message.type != 'ping') && (message.type != 'loadavg')){
    log_message('Computer emitting message: ' + SmallStrfy(message));
  }
  ChatRoomMessage(message);
}, app);

ChatRoomAddMember(compute_member);

// Download or get contents of a file, zipping if it's a directory
function get_download(req, res) {
  //console.log('GETTING DOWNLOAD', req.params)
  var path = decodeURIComponent(req.params.path);
  var name = path.split('/').slice(-1)[0];
  var full_path = path[0] === '/' ? path : '/' + path;

  //console.log('get_download:' , full_path ,  path);
  fs.stat(full_path, function(err, stats) {
    if (err) {
      res.send(400, 'Couldn\'t get file');
      return;
    }
    if (stats.isDirectory()) {
      var id = randomstring.generate(64);
      var destination = '/tmp/' + id + '/';
      //var full_destination = destination + name + '.tar.gz';
      var full_destination = destination + name + '.zip';
      fs.mkdir(destination, function() {
        // Zip has undesirable side effect
        //cp.exec('tar -czf ' + full_destination + ' -C ' + full_path + '/.. ' + name, function(err, stdout) {
        cp.exec('zip -r -q ' + full_destination  + ' ./' + name, {
          cwd: full_path + '/..'
        }, function(err, stdout) {
          if (err) {
            res.send(500, err + 'Something went wrong when zipping!');
            console.log(err);
            return;
          }
          //res.download(full_destination, name, function(err) {
          res.download(full_destination, function(err) {
            if (err) {
              // check res.headersSent to figure out if we should fail
              console.log(err);
              return;
            }
            cp.exec('rm -rf ' + destination, function(err) {
              // what if this fails?
            });
          });
        });
      });
    } else { // is a file
      res.download(full_path, name, function(err) {
        if (err) {
          console.log(err);
          // check res.headersSent to figure out if we should fail
          return;
        }
      });
    }
  });
}

app.get('/download/:path', get_download);
app.get('/execSync', function(req, res) {
  var result = exec(req.param('cmd'));
  res.send(result);
});

app.get('/exec', function(req, res) {
  var child = spawn(req.param('cmd'));
  child.stdout.on('data', function(chunk) {
    console.log(chunk);
  });
  child.stderr.on('data', function(chunk) {
    console.log(chunk.toString());
  });
  child.on('close', function() {
    res.send('Success');
  });
});

app.post('/update/:version', function (req, res) {
  if (env === 'development') {
    return log_message("No /update in development mode, do a manual update.");
  }

  // Get new version
  var newVersion = req.param('version');

  // TODO: Where are we hosting the new version?

  // Start it

  // Die
  res.send(200, "Update Complete");
  process.exit(0);
});


////////////////////////////
// class: ChatRoom       ///
////////////////////////////
var chatrooms = {};

function ChatRoomSend(member, msg) {
  if (member.type == 'socket.io') {
    member.pipe.emit('message', msg);
  } else if (member.type == 'childprocess') {
    member.pipe.handle_message(msg);
  }
}

function ChatRoomMessage(msg) {
  //log_message('ChatRoomMessage to ', msg.to, JSON.stringify(msg));

  var k;
  var target;
  if (msg.to) {
    // Sending to a particular target
    if (msg.to.indexOf('.') >= 0) {
      target = chatroom_members[msg.to];
      if (!target) {
        log_message('target not in chatroom!: ' + msg.to);
        log_message('was sending message: ' + JSON.stringify(msg));
      } else {
        ChatRoomSend(target, msg);
      }
      // Sending to a class of targets, e.g., files.[randomid] or term.[randomid]
    } else {
      for (k in chatroom_members) {
        if (k.split('.')[0] == msg.to) {
          target = chatroom_members[k];
          ChatRoomSend(target, msg);
        }
      }
    }
  } else {
    for (k in chatroom_members) {
      target = chatroom_members[k];
      if (target == msg.from) {
        continue;
      }
      ChatRoomSend(target, msg);
    }
  }
}

// adds a server to a room and returns it or null otherwise
// member should have:
//   name: name
//   type: childprocess, socket.io
//   pipe: message receiver

function ChatRoomAddMember(member) {

  log_message('ChatRoomAddMember ' +  member.name);

  chatroom_members[member.name] = member;
  chatroom_size++;
  log_message('chatroom_size ' + chatroom_size);
  // send 'hello' to all members in the room telling them who is in the room
  var members = {};
  for (var k in chatroom_members) {
    members[k] = true;
  }
  ChatRoomMessage({
    type: 'hello',
    from: member.name,
    data: members
  });
}

/////////////////////////////////////
// start server
/////////////////////////////////////

io.of('/ipc').on('connection', function(socket) {
  log_message('new client connected');
  var address = socket.handshake.address;

  var my_socket = socket;

  socket.on('echo', function(arg, cb) {
    console.log('echoing', arg, cb);
    if (cb) {
      cb(arg);
    }
    socket.emit('message', 'echo');
  });

  socket.on('message', function(message) {
    if(message.type != 'ping') {
      log_message('Computer received message: ' + SmallStrfy(message));
    }
    ChatRoomMessage(message);
  });

  socket.on('disconnect', function() {
    log_message('disconnecting people from room');
    // delete person in the room
    for (var memberName in chatroom_members) {
      if (memberName == 'computer') {
        continue;
      }
      var member = chatroom_members[memberName];
      if (member.pipe === socket) {
        console.log('deleted ' + memberName);
        delete chatroom_members[memberName];
        chatroom_size--;
      } else {
        console.log('didn\'t delete ' + memberName);
      }
    }
  });

  socket.on('join', function(message) {
    var memberName = message.memberName; // type of connector
    log_message('joined ' + memberName);
    var client = {
      type: 'socket.io',
      pipe: my_socket,
      name: memberName
    };
    // don't add a computer if there is already one in the room
    ChatRoomAddMember(client);
  });
});

// setup GA
var gaID = 'UA-52357031-2'
fs.readFile('visitor_info', 'utf8', function (err, data) {
  // if file is not found, generate UUID, save it, and report that someone has installed the web-terminal
  if (err) {
    var id = uuid.v4()
    var visitor = ua(gaID, id);
    fs.writeFileSync('visitor_info', id, 'utf8')
    visitor.event("IDE", "Installed", function(error) {
      if (error) {
        console.err(error);
      }
    }).send()
    return
  }
});

var server;

if (!module.parent) {
  if (env == 'production') {
    try {
      fs.unlinkSync('web-terminal-prod.sock');
    } catch (e) {}
    app.listenToSocket('web-terminal-prod.sock');
    console.log('App started [PRODUCTION]');
    server = app.listen(port, function() {
      console.log('Started HTTP server on port %s', port);
    });
  } else {
    try {
      fs.unlinkSync('web-terminal-dev.sock');
    } catch (e) {}
    app.listenToSocket('web-terminal-dev.sock');
    server = app.listen(port, function() {
      console.log('Started HTTP server on port %s', port);
    });
  }
}


module.exports.app = app;

