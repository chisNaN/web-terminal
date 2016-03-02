var emails = require('email')
  , crypto = require('crypto')
  , fs = require('fs')
  , cp = require('child_process')
  , path = require('path')
  , http = require('http');

var request = require('request');
// num = number of tries
// i = current try ( auto initialized to 1 )
function send_request(uri, headers, cb, num) {
  num = num || 100;
  var i = 0;
  if(uri.slice(0,7) != 'http:\/\/') {
    uri = 'http:\/\/'+ uri;
  }
  function go() {
    request({
        uri: uri,
        headers: headers,
        timeout: 150 + i * 10
      },
      function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
          console.log('succeeded!:' + body);
          cb(true, body);
          return true;
        }
        if (i++ < num) {
          var timeout = 100 + i * 50;
          console.log("failed " + i + " / " + num + " waiting " + timeout);
          setTimeout(go, timeout);
        } else {
          cb(false);
        }
      });
  }
  go();
}



///////////////////
// REQUESTS
///////////////////

function getRequest(host, options, callback) {
  if (options.port === undefined) {options.port = 80;} 
  if (options.path === undefined) {options.path = '/';} 

  var req = http.get({host:host, port: options.port, path: options.path}, function(res) {
    var my_name = "";
    res.on("data", function(data) { my_name += data; });
    res.on("end", function() { callback(my_name, null); });
  }).on('error', function(e) {
    callback(null, e);
  });
}
exports.getRequest = getRequest;


// function that buffers response and then calls callback with result
function bufferHttpResponse(callback) { 
  return function(res) {
    var buffer = "";
    res.on("data", function(data) {
      console.trace();
      console.log('bufferHttpResponse:' + data);
      buffer += data; 
    });
    res.on("end", function() { 
      console.trace();
      callback(buffer, null); 
    });
  }
};
exports.bufferHttpResponse = bufferHttpResponse;


exports.retryRequest = send_request;

///////////////////
// UTIL
///////////////////

function makeCounter() {
  var count = 0;
  return function() {return count++}
};
exports.makeCounter = makeCounter;

///////////////////
// MAIL
///////////////////

emails.from = 'admin@terminal.com'

function sendEmail(address, subject, body, cb) {
  var mail = new emails.Email({ to: address
                              , subject: subject
                              , body: body
                             })
  
  // TODO: install sendmail and re-enable
  //mail.send(function(err) {
  //  cb(err);
  //})
}

exports.sendEmail = sendEmail;


/////////////////
// FILES
/////////////////

function ensure_dir_exists(folder, cb) {
  path.exists(folder, function(exists) {
    if (exists) {
      cb(null)
    } else {
      cp.exec('mkdir -p ' + folder, function(error, stdout, stderr) {
        cb(error);
      })
    }
  });
}
exports.ensure_dir_exists = ensure_dir_exists;

function get_first_valid_name(name, try_num, cb) {
  //if (try_num == 100) {res.end('Failed')};

  var try_name;
  if (try_num != 0) {
    try_name = name + '.' + try_num;
  } else {
    try_name = name;
  }

  path.exists(try_name, function(exists) {
    console.log('finding valid name... ' , try_name, exists)
    if (exists) {
      get_first_valid_name(name, try_num + 1, cb);
    } else {
      cb(try_name);
    }
  });
}

exports.get_first_valid_name = get_first_valid_name;

/////////////////////////////////////
// PORT SCANNING
////////////////////////////////////

var net = require('net');

//Check and see if you can hit port 22 within some timeout
function is_port_open(host,port,timeout,callback) {
  var s = new net.Socket();
  s.setTimeout(timeout, function () {
    s.destroy();
    callback(false);
  });
  s.connect(port, host, function () {
    s.destroy();
    callback(true);
  });
  s.on('error', function(e) {
    s.destroy();
    callback(false);
  });
};

exports.is_port_open = is_port_open;
