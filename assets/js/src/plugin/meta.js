/* jshint -W117 */

$(document).ready(function() {
  var socket = get_socket('meta');

  $('#reconnect_button').click(function() {
    initialize_actual_socket();
  });

  //
  // PING RELATED
  //

  var PING_FREQUENCY = 2000;
  var AVERAGE_PING_THRESHOLD = 150;
  var SINGLE_PING_THRESHOLD = 200;
  var last_pings = [AVERAGE_PING_THRESHOLD,
                    AVERAGE_PING_THRESHOLD,
                    AVERAGE_PING_THRESHOLD,
                    AVERAGE_PING_THRESHOLD,
                    AVERAGE_PING_THRESHOLD];

  function handle_ping(msg_time) {
    if (!msg_time) { return; }

    // calculate ping time and average ping
    // TODO: display an accurate ping time during the first ~5 pings
    var ping_time = msg_time && (new Date().getTime() - msg_time);
    var average_ping_time = 0;

    last_pings.shift();
    last_pings.push(ping_time);
    for (var i = 0; i < last_pings.length; i++) {
      average_ping_time += last_pings[i];
    }
    average_ping_time /= last_pings.length;
    display_connection_status(ping_time, average_ping_time);
  }

  function display_connection_status(ping_time, average_ping_time) {
    var $status_icon = $('#connection_status');
    var $status_text = $('#meta_stats .ping_stat');
    var ping_time_display = '(' + ping_time.toFixed(0) + 'ms)';
    $status_icon.removeClass('waiting_connection good_connection slow_connection no_connection');

    if (ping_time === null) {
      $status_icon.addClass('no_connection');
      $status_text.html('Waiting for connection...');
    } else if (average_ping_time > AVERAGE_PING_THRESHOLD || ping_time > SINGLE_PING_THRESHOLD) {
      $status_icon.addClass('slow_connection');
      $status_text.html('<span class="fa fa-question-circle"></span> Slow Connection ' + ping_time_display);
    } else {
      $status_icon.addClass('good_connection');
      $status_text.html('<span class="fa fa-check-circle"></span> Good Connection ' + ping_time_display);
    }
  }

  setInterval(function() {
    socket.emit('message', {
      from: 'term',
      to: 'computer',
      type: 'ping',
      passback: '0',
      time: new Date().getTime(),
      client_id: client_id
    });
  }, PING_FREQUENCY);

  //
  // LOAD AVERAGE RELATED
  //

  function display_loadavg(response) {
    if (!response) { return; }

    if (response.cpu !== null) {
      $('#meta_stats .cpu_stat').html('CPU: ' + response.cpu.toFixed(1) + '%');
    } else {
      $('#meta_stats .cpu_stat').empty();
    }

    if (response.memory !== null) {
      $('#meta_stats .mem_stat').html('RAM: ' + formatBytes(response.memory));
    } else {
      $('#meta_stats .mem_stat').empty();
    }
  }

  //
  // HEARTBEAT RELATED
  //

  function heartbeat(ctid) {
    function finish(err, nextbeat_interval) {
      nextbeat_interval = nextbeat_interval || 10*60*1000;
      console.log('next beat', nextbeat_interval);
      if (err) {console.log('heartbeat error', err);}
      setTimeout(function() {
        heartbeat(ctid);
      }, nextbeat_interval);
    }

    // main_domain from constants.js
    if (main_domain) {
      $.getJSON('//' + main_domain + '/containers/heartbeat/' + ctid, function(data) {
        if (data.err) { return finish(data.err); }
  
        if (data.time == 'Infinity') {
          // heartbeat after 10 minutes
          finish(null, 10*60*1000);
        } else if (data.time) {
  
          if (getParameterByName('embedtoken')) {
            var cookiename = 'embed' + getParameterByName('embedtoken');
            // TODO: be a bit conservative?
            var new_expire_time = Date.now() + data.time;
            var cookie_domain =  '.' + document.domain.split('.').slice(1).join('.');
            var expire_date = new Date(Date.now() + data.time);
            console.log('new embed cookie', cookiename,
                        'expire',  expire_date,
                        'domain', cookie_domain);
            $.cookie(cookiename, $.cookie(cookiename), {
              expires: expire_date,
              domain: cookie_domain,
              path: '/',
            });
          }
  
          console.log('heartbeat, time to expiration', data.time);
          setTimeout(function() { heartbeat(ctid); }, data.time / 2);
        }
      });
    }
  }

  var death_interval;
  var increase_time_button;
  var death_timer;

  function formatTime(ttl) {
    var s = Math.floor(ttl / 1000);
    var m = Math.floor(s / 60);
    s = (s % 60) + '';
    if (s.length == 1) {s = '0' + s;}
    var h = Math.floor(m / 60);
    m = (m % 60) + '';
    if (m.length == 1) {m = '0' + m;}
    return h + ':' + m + ':' + s;
  }

  function nag_user(ttl_in_minutes) {
    var html =  'This is a temporary container. It will self-destruct in ' +
      ttl_in_minutes + ' minutes.  Click away to dismiss.';
    show_main_modal(text_box().html(html));
  }

  // TODO: this is not done
  function increase_max_time(ctid) {
    if (main_domain) {
      $.getJSON('//' + main_domain + '/containers/maxTimeRemaining/' + ctid, function(data) {
        var timeRemaining = parseFloat(data.time); // in milliseconds
        if (data.err) {
          // timeRemaining = 35000000;
          console.log('get max time error', data.err);
          return;
        }
        console.log('max expire time remaining', timeRemaining);

        if (isFinite(timeRemaining)) {
          if (death_timer) {death_timer.remove();}
          if (increase_time_button) {increase_time_button.remove();}
          var nag_time_minutes = [30, 15, 5];

          for(var i in nag_time_minutes) {
            var next_nag = nag_time_minutes[i];
            setTimeout(nag_user.bind(this, next_nag), timeRemaining-next_nag*60*1000-10000);
          }

          var approx_death_time = Date.now() + timeRemaining;

          death_timer = $('<li>')
            .append($('<a>').attr('id', 'death_timer_link'))
            .click(function() {
              nag_user(Math.floor( (approx_death_time-Date.now()) / (60*1000)) );
            });

          $('#top_bar_right_list').prepend(death_timer);

          var update_death_time = function() {
            var ttl = approx_death_time - Date.now() ;
            if (ttl < 0) {
              var expire_message = 'This session has expired! Log in to create permanent sessions.';
              show_main_modal(text_box(expiry_message));
              clearInterval(death_interval);
              //increase_time_button.remove();
              death_timer.remove();
            } else {
              var time = formatTime(ttl);
              var txt = 'Self Destruction in ' + time;
              $('#death_timer_link').text(txt);
            }
          };
  
          update_death_time();
          clearInterval(death_interval);
          death_interval = setInterval(update_death_time, 500);
        }
      });
    }
  }

  var MessageHandlers = {
    hello: function(msg) {
    },
    loadavg: function(msg) {
      //display_loadavg(msg.result);
    },
    ping: function(msg) {
      if (msg.client_id == client_id) {
        handle_ping(msg.time);
      }
    },
    get_script: function(msg) {
      console.log('get script', msg);
      $.getScript(msg.file, function() { console.log('script gotten'); });
    },
    ctid: function(msg) {
      // learn our ctid, ask the server if we are on countdown
      var ctid = msg.ctid;
      increase_max_time(ctid);
      heartbeat(ctid);
    },
    show_error: function(msg) {
      console.log('show error', msg.error);
      //show_main_modal(text_box('Error: \n' + msg.error));
    }
  };

  socket.on('message', function(msg) {
    if (msg.type in MessageHandlers) {
      return MessageHandlers[msg.type](msg);
    } else {
      console.log('UNHEARD MESSAGE IN META OF TYPE ', msg.type);
    }
  });

});
