//////////////////////////////////////////////////////////
// LOGGING
//////////////////////////////////////////////////////////

// TODO: could events get too large?

var terminal_log = { listeners:[], events:[] };

function logEvent(e) {
  terminal_log.events.push(e);
  for(var i in terminal_log.listeners) {
    terminal_log.listeners[i](e, terminal_log.events, terminal_log.events.length);
  }
}

var utils = {};

(function(exports, client_side) {
  if (client_side) {
    exports.is_mac  = (navigator.userAgent.indexOf('Mac OS X') >= 0);
    exports.cmd_key = (exports.is_mac) ? 'Cmd' : 'Ctrl';
  }

  // debounce a function, executing it only on the trailing edge of exec_interval
  exports.exec_sparsely = function(fn, exec_interval) {
    exec_interval = exec_interval || 100;
    var timeout_var = null;
    var last_execution = Date.now();
    return function() {
      var args = arguments;
      if (Date.now() - last_execution > exec_interval) {
        fn.apply(fn, args);
        last_execution = Date.now();
        clearTimeout(timeout_var);
        timeout_var = null;
      } else {
        clearTimeout(timeout_var);
        timeout_var = setTimeout(function() {
          fn.apply(fn, args);
          timeout_var = null;
          last_execution = Date.now();
        }, exec_interval);
      }
    };
  };

  ///////////////////////
  // VERSIONS
  ///////////////////////

  // return true if v0 > v1
  exports.compare_versions = function(v0, v1) {
    function comparatorize(v) {
      return v.replace('v', '').split('.').map(function(x) {return parseInt(x);});
    }
    v1 = comparatorize(v1);
    v0 = comparatorize(v0);
    for(var i=0; i<v1.length ; i++) {
      if (v0[i] > v1[i]) {
        return true;
      } else if (v0[i] < v1[i]) {
        return false;
      }
    }
    return false;
  };

})((typeof exports === 'undefined') ? utils : exports, (typeof exports === 'undefined'));
