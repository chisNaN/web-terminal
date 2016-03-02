/* eslint-disable camelcase, block-scoped-var, no-unused-vars */
/* globals $, server_url, Queue, get_file, io, client_id, uuid */

var sockets = {};
// ONLY ONE REAL SOCKET
var actual_socket;
var socket_members = {};


var message_queue = new Queue();
var message_queueing = false;

var socket_message_handlers = {};
var socket_cb_table = {};

function handle_socket_message(msg) {
  if (msg === null) {
    /* eslint-disable no-console */
    console.log('Received null socket message', msg);
    /* eslint-enable no-console */
    return;
  }

  if (message_queueing === true) {
    message_queue.enqueue(msg);
    return;
  }

  if (msg.type === 'callback') {
    var cb = socket_cb_table[msg.id];
    if (cb) {
      cb.apply(cb, msg.arguments);
      delete socket_cb_table[msg.id];
    }
    return;
  }
  if (msg.type === 'file_message') {
    message_queueing = msg.sync_matters;

    get_file('./local/' + msg.id + '.json', function(message) {
      // FIXME: This introduces a race condition when multiple messages require syncing
      message_queueing = false;
      handle_socket_message(message);
      // recursion could get deep, maybe?
      while ((!message_queue.isEmpty()) && (!message_queueing)){
        message = message_queue.dequeue();
        handle_socket_message(message);
      }
    }, 'json');
    return;
  }

  var handler;
  var to;
  if (!msg.to) { // broadcast to all
    for (to in socket_message_handlers) {
      handler = socket_message_handlers[to];
      handler(msg);
    }
  } else {
    if (msg.to.indexOf('.') >= 0) {
      to = msg.to.split('.')[0];
    } else {
      to = msg.to;
    }
    handler = socket_message_handlers[to];
    handler(msg);
  }
}

function joinMember(memberName) {
  // SEE: https://github.com/LearnBoost/socket.io-client/issues/341
  if (socket_members[memberName].joined) { return; }
  if (actual_socket) { // TODO: also check if it is connected??
    actual_socket.emit('join', { memberName: memberName });
    socket_members[memberName].joined = true;

    // clear emit queue
    for (var k in socket_members[memberName].emit_queue) {
      var emit_message = socket_members[memberName].emit_queue[k];
      actual_socket.emit(emit_message[0], emit_message[1]);
    }
    socket_members[memberName].emit_queue = [];
  }
}

function unjoin_member(memberName) {
  // SEE: https://github.com/LearnBoost/socket.io-client/issues/341
  socket_members[memberName].joined = false;
}


function initialize_actual_socket() {
  actual_socket = io.connect(server_url + '/ipc', {
    'force new connection': true,
    'reconnect': true,
    'reconnection delay': 500,
    'max reconnection attempts': 10,
  });

  // SEE: https://github.com/LearnBoost/socket.io/wiki/Exposed-events

  var disconnect_wait = 5000;
  var disconnect_timeout = null;

  // TODO: MAKE A QUEUE FOR EVENTS BEFORE THE SOCKET IS CONNECTED??
  actual_socket.on('connect', function() {
    $('#reconnect_modal').modal('hide');
    for (var member in socket_members) {
      isMemberAllowed(socket_members[member].base, joinMember.bind(null, member));
    }
    clearTimeout(disconnect_timeout);
  });

  actual_socket.on('disconnect', function(){
    disconnect_timeout = setTimeout(function() {
      $('#reconnect_modal').modal('show');
    }, disconnect_wait);

    // reconnect
    for (var memberName in socket_members) {
      unjoin_member(memberName);
    }
  });

  actual_socket.on('message', function(msg){
    handle_socket_message(msg);
  });

}

//
initialize_actual_socket();

function get_actual_socket() {
  return actual_socket;
}

function isMemberAllowed(member, cb) {
  var oldMembers = ['meta', 'html', 'editor', 'files', 'graph'];
  return cb();
}

function get_socket(member) {
  if (sockets[member]) { return sockets[member]; }

  var memberName = member + '.' + client_id;

  socket_members[memberName] = {
    base: member,
    joined: false,
    emit_queue: [],
  };
  var member_socket = {
    emit: function(message_type, message, cb) {
      if (cb) {
        var id = uuid.v4();
        socket_cb_table[id] = cb;
        message.cb = id;
      }
      if (!message.from) { message.from = memberName; }
      if (!message.to) { message.to = 'computer'; }
      var socket_member = socket_members[memberName];
      if (socket_member.joined) {
        if (socket_member.emit_queue.length !== 0) {
          /* eslint-disable no-console */
          console.log('member joined, but emit queue non-empty?');
          /* eslint-enable no-console */
        }
        actual_socket.emit(message_type, message);
      } else {
        socket_member.emit_queue.push([message_type, message]);
      }

    },
    on: function(event_type, callback) {
      if (event_type === 'message') {
        socket_message_handlers[member] = callback;
      } else {
        /* eslint-disable no-console */
        console.log('Don\'t know what to do with registering of: ', event_type);
        /* eslint-enable no-console */
       // registered different event??
      }
    },
  };

  sockets[member] = member_socket;
  isMemberAllowed(member, joinMember.bind(null, memberName));
  return member_socket;
}
