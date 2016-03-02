/* jshint -W117 */

var parts = document.URL.split('/');
var server_dns = parts[2];
var client_id = '' + Date.now() + Math.random();
console.log('CLIENT_ID', client_id);

// TODO: pass this stuff in via url.  don't forget the http!
var server_url = '//'+server_dns ;

var webserver = document.referrer.split('/compute')[0];
//console.log('WEB SERVER', webserver);

var user;

var subdomain = document.domain.split('.')[0];
document.title = subdomain;
var main_domain_part = document.domain.split('.').slice(1).join('.');

// externalUrl is grabbed from the constants.js file.
var main_domain = externalUrl;

function bind_dropdown_submenus() {
  $('.dropdown-submenu').unbind('mouseover');
  $('.dropdown-submenu').siblings().unbind('mouseover');

  $('.dropdown-submenu').mouseover(function(ev) {
      $(this).children('.dropdown-menu').css('display', 'block');
  });

  // TODO: this could have bad side effects!
  $('.dropdown-submenu').siblings().mouseover(function(ev) {
      $(this).siblings('.dropdown-submenu').find('.dropdown-menu').css('display', 'none');
  });
}

$(document).ready(function() {
  // Refresh resize iframe when opening
  $('#nav_link_resize').click(function(){
    var $iframe = $(this).parent().find('iframe');
    if (!$iframe.is(':visible')) {
      $iframe.attr( 'src', function ( i, val ) { return val; });
    }
  });

  // Sometimes focus gets stuck on iframe.
  $('body').click(function(){
    if (document.activeElement.tagName === 'IFRAME') {
      document.activeElement.blur();
    }
  });

  $('.loading_backdrop').empty().hide();

  bind_dropdown_submenus();

  if (!compute_settings.hide_top_bar) { $('#top_bar').show(); }

  // make top bar act like a menu, allow user to switch between one dropdown to another by hover
  $('#top_bar_right_list > .dropdown').hover(function() {
    var dropdowns = $('#top_bar_right_list > .dropdown');
    for (var k = 0; k < dropdowns.length; k++) {
      var dropdown = $(dropdowns[k]);
      if (dropdown.hasClass('open')) {
        dropdowns.removeClass('open');
        $(this).addClass('open');
        $(this).trigger('show.bs.dropdown');
        return;
      }
    }
  });

  $('#reconnect_modal').modal({'backdrop': 'static', 'keyboard': false, 'show': false});
  $('#tos_modal').modal({'backdrop': 'static', 'keyboard': false, 'show': false});

  $('#agree_tos').click(function() {
    $('#tos_modal').modal('hide');
    $.cookie('tos_agreed', 'true', {domain: '.' + main_domain_part, path: '/'});
  });

  var terminal_subdomain = window.location.host.replace(main_domain_part, '').replace('.', '');
  $('#nav_terminal_name').text(terminal_subdomain);

  $(window).resize(_.throttle(onWindowResize));
  function onWindowResize() {
    var availableHeight = $(window).height() - $('#top_bar').outerHeight();
    var maxHeight = Math.max(0, availableHeight - 30);
    $('#terminals_dropdown .dropdown-menu').css('max-height', maxHeight);
  }

  if (main_domain) {
    $('#nav_link_main').attr('href', '//' + main_domain);
    $('#nav_logo').attr('src', '//' + main_domain + '/img/logo.png');
    $('#nav_link_tos').attr('href', '//' + main_domain + '/terms' );

    $.ajax({
      type: 'GET',
      url: '//' + main_domain + '/is_logged_in', // This aliases /whoami for x-origin
      success: function(result) {
        if (result.user) {
          user = result.user;
          $('#nav_link_snapshots').attr('href', '//' + main_domain + '/snapshots').parent().show();
          $('#nav_link_terminals').attr('href', '//' + main_domain + '/terminals').parent().show();
          $('#nav_link_logout').attr('href', '//' + main_domain + '/logout').parent().show();
          $('#terminals_dropdown').show();
          initializeFrame('#terminals_dropdown iframe', '//' + main_domain + '/containers/terminalsPopover');
        } else {
          if ($.cookie('tos_agreed') !== 'true') { $('#tos_modal').modal('show'); }
          $('#nav_link_login').attr('href', '//' + main_domain + '/login').parent().show();
          $('#nav_link_signup').attr('href', '//' + main_domain + '/signup').parent().show();
          $('#terminals_dropdown').parent().removeClass('dropdown').find('.dropdown-menu').remove();
          $('#terminals_dropdown').find('.caret').remove();
          $('#terminals_dropdown').show();
        }
      },
      xhrFields: {
        withCredentials: true
      }
    });
  };

  function initializeFrame(frame_selector, frame_url) {
    var $frame = $(frame_selector);
    var previous_dark_state = $('body').hasClass('theme_dark');
    var loaded = false;

    $frame.closest('.dropdown').on('show.bs.dropdown', function() {
      var is_dark = $('body').hasClass('theme_dark');
      if (loaded && (is_dark === previous_dark_state)) {
        return;
      }
      if (main_domain) {
        $('#nav_link_privacy').attr('href', '//' + main_domain + '/privacy');
      }
      loaded = true;
      previous_dark_state = is_dark;
      $frame.attr('src', frame_url + (is_dark ? '?dark=true' : ''));
      iFrameResize({checkOrigin: false}, frame_selector);
    });
  }

  if (main_domain) {
    $.ajax({
      type: 'GET',
      url: '//' + main_domain + '/container_info',
      xhrFields: { withCredentials: true },
      success: function(result) {
        if (result.error) {
          return console.log('container info error', result.error);
        }
        // NOTE: could just make these use subdomain to avoid needing the container_info route
        document.title = result.name;

        $('#resize_dropdown').show();
        $('#nav_link_edit').attr('href', '//' + main_domain + '/containers/edit/' + result.container_key);
        $('#snapshot_dropdown').show();
        $('#nav_link_snapshot').attr('data', '//' + main_domain + '/snapshot/new/' + result.container_key);
        $('#sharing_dropdown').show();
        $('#nav_link_share').attr('href', '//' + main_domain + '/snapshot/new/' + result.container_key);

        initializeFrame(
          '#resize_dropdown iframe',
          '//' + main_domain + '/containers/resizePopover/' + result.container_key
        );
        initializeFrame(
          '#sharing_dropdown iframe',
          '//' + main_domain + '/containers/sharingPopover/' + result.container_key
        );
        initializeFrame(
          '#snapshot_dropdown iframe',
          '//' + main_domain + '/containers/snapshotsPopover/' + result.container_key
        );
      }
    });
    $('#nav_link_faq').attr('href', '//' + main_domain + '/faq');
  }

  $('#nav_link_snapshot').click(function(result){

    var link = $('#nav_link_snapshot').attr('data');
    //Check for python notebook terminal

    function pythonnbSnapshot(s3AccessUrl){
      var command = 'if [ -f /terminalPynb/notebookSnapshot.true ]; then echo exists;else notexist; fi';
      sockets.meta.emit('message', {'type': 'execshellsync', 'cmd': command},
          function(response) {
            var result = response.stdout.replace(/(\r\n|\n|\r)/gm,'');

            if(result == 'exists'){ // TODO: <--- make this better
              sockets.meta.emit('message', {'type': 'list', 'path': '/home/notebooks'},
                function(err, files) {
                  if (err){
                      console.log(err);
                  }

                  function execShellSyncHandler(link) {
                    return function(response) {
                      window.location.href = link;
                    };
                  }
                  for (i = 0; i < files.length; i++) {
                    if (files[i].name.indexOf('.ipynb', files[i].name.length - 6) !== -1) {
                      var notebookName  = files[i].name.replace(/\s/g, '\\ ');
                      link = link + '?display_style=pynb&pynb='  + s3AccessUrl.url;

                      //Upload File
                      var  upload = '/terminalPynb/publishterminal.sh /home/notebooks/' +
                                    notebookName + ' \'' + s3AccessUrl.signed_request + '\' ';

                      sockets.meta.emit('message', {'type': 'execshellsync', 'cmd': upload}, execShellSyncHandler);
                      return;
                    }
                }
              });
            }
      });
    }

    if (main_domain) {
      $.ajax({
        url: '//' + main_domain + '/pynbStorage',
        dataType: 'jsonp',
        beforeSend: function(xhr){
          xhr.withCredentials = true;
        },
        success: function(data, textStatus, xhr) {
          pythonnbSnapshot(data);
        },
        error: function(error, status){
          console.log(error);
        }
      });
    }
  });

  // TODO: Layout.save?
  //$('#nav_link_snapshot').click(function() {
  //})
  
  // initialize feedback button
  window.Feedback();
});

function getParameterByName(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]'); // wut
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

ga('create', 'UA-52357031-2', 'auto');
var lastActive
$.ajax({
  url: '/files/' + dirname + '/visitor_info', 
  dataType: 'text',
  success: function(visitor_info) {
    $('body').keyup(function() {
      console.log('keyUp');
      lastActive = new Date();
    });
  }
});

setInterval(function() {
  console.log('set interval')
  ga('send', 'event', 'interface', 'heartbeat', {lastActive: lastActive});
}, 1000 * 60 * 60);


var compute_settings = { };
if (getParameterByName('hide_top_bar') == 'true') { compute_settings.hide_top_bar = true; }
if (getParameterByName('maximize')) { compute_settings.maximize = getParameterByName('maximize').toLowerCase(); }

