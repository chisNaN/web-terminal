/* globals get_socket, HtmlManager, _ */

(function(exports) {

  $(document).ready(function() {
    exports.show();

    var socket = get_socket('html');
    var iframeMouseOver = false;
    var poppedFrames = [];

    exports.frames = {};
    exports.curframe = null;
    exports.newTab = newTab;
    exports.SelectTab = selectTab;
    exports.CloseTab = closeTab;
    exports.NextTab = switchTabFn(1);
    exports.PrevTab = switchTabFn(-1);
    exports.CloseCurTab = closeCurTab;
    /* eslint-disable camelcase */
    exports.submit_frame = submitFrame;
    exports.set_frame = setFrame;
    exports.new_frame = newFrame;
    exports.close_frame = closeFrame;
    exports.popout_frame = popoutFrame;
    exports.popout_cur_iframe = popoutCurFrame;
    exports.reload_cur_iframe = reloadCurFrame;
    /* eslint-enable camelcase */

    $('#html_container .empty_newtab').click(exports.newTab);
    // $('#html_url_input').change(reload_iframe)
    $('#html_form').submit(submitFrame);
    $('#html_refresh').click(reloadCurFrame);
    $('.html_popout').click(exports.popout_cur_iframe);
    // handle focus when clicks over iframe
    $(window).on('blur', function (){ if(iframeMouseOver){ exports.focus(); } });

    socket.on('message', handleMessage);
    makeTabs();

    function selectTab(id) {
      if (id === null) {
        $('#html_bar').hide();
        $('#html_content_div').hide();
        $('#html_x-origin').hide();
        return;
      }

      $('#html_bar').show();
      $('#html_content_div').show();

      exports.curframe = id;
      var info = exports.frames[id];

      $('.html_frame').hide();
      $('#html_url_input').val(info.url);

      if (info['x-origin']) {
        $('#html_x-origin').show();
      } else {
        $('#html_x-origin').hide();
        info.iframe.show();
      }

      makeTabs();
    }

    function closeTab(id) {
      socket.emit('message', {'type': 'close_frame', 'id': id});
    }

    function makeTabs() {
      var bar = $('#htmltablist');
      bar.empty();

      var button = $('<div>').addClass('tab newtab').click(exports.newTab);
      var title = $('<span>').text('+');
      button.append(title);
      bar.append(button);

      function makeClickHandler(x) {
        return function() { exports.SelectTab(x); };
      }

      function makeDestroyHandler(x) {
        return function(e) {
          e.preventDefault();
          exports.CloseTab(x);
          return false;
        };
      }

      var activeright = false;
      for (var i in exports.frames) {
        button = $('<div>').addClass('tab term').click(makeClickHandler(i));
        button.css('text-align', 'center');

        $('<span>').addClass('tab_title').text(i).appendTo(button);
        var closeLink = $('<span>').addClass('closetab').html('&times;').click(makeDestroyHandler(i));
        button.append(closeLink);

        if (activeright) { button.addClass('activeright'); activeright = false; }
        if (i === exports.curframe.toString()) { button.addClass('active'); activeright = true; }

        bar.append(button);
      }

    }

    function switchTabFn(diff) {
      return function() {
        var tabarray = [];
        var index = null;
        for (var i in exports.frames) {
          if (i === exports.curframe.toString()) { index = tabarray.length; }
          tabarray.push(i);
        }
        if (index !== null) {
          var newSelected = tabarray[(index + diff + tabarray.length) % tabarray.length];
          exports.SelectTab(newSelected);
        }
      };
    }

    function submitFrame() {
      var url = $('#html_url_input').val();

      var info = { url: url };
      socket.emit('message', {'type': 'set_frame', 'to': 'computer', 'id': exports.curframe, info: info});

      return false; // for jQuery
    }

    function setFrame(id, info) {
      if (!exports.curframe) {
        exports.open();
      }

      if (exports.frames[id] && exports.frames[id].iframe) {
        exports.frames[id].iframe.remove();
      }

      info.iframe = $('<iframe>')
        .addClass('html_frame')
        .appendTo($('#html_content_div'))
        .on('mouseover', function(){ iframeMouseOver = true; })
        .on('mouseout', function(){ iframeMouseOver = false; });
      info.iframe.attr('src', getUrlFromInfo(info));

      exports.frames[id] = info;
      selectTab(id);
      makeTabs();
    }

    function checkPrefetchedFrame(id, info) {
      id = id.toString();
      var frame = exports.frames[id];

      if (frame.url !== info.url) { return; }

      _.extend(frame, info);

      if (exports.curframe.toString() === id && info['x-origin']) { selectTab(id); }
    }

    function newTab() {
      newFrame();
    }

    function newFrame(info) {
      socket.emit('message', {to: 'computer', type: 'new_frame', info: info});
    }

    function closeFrame(id) {
      id = id.toString();
      if (id === exports.curframe.toString()) {
        // choose new curframe
        exports.curframe = null;
        var breaknext = false;
        for (var id2 in exports.frames) {
          if (breaknext) {
            exports.curframe = id2;
            break;
          }
          if (id === id2) {
            breaknext = true;
          } else {
            exports.curframe = id2;
          }
        }
      }

      if (exports.frames[id].iframe) {
        exports.frames[id].iframe.remove();
      }
      delete exports.frames[id];
      exports.SelectTab(exports.curframe);
      makeTabs();
    }

    function closeCurTab() {
      if (exports.curframe) { exports.CloseTab(exports.curframe); }
    }

    function popoutFrame(id) {
      var url = getUrlFromInfo(exports.frames[id]);
      if (url) {
        var poppedWindow = window.open(url);
        poppedFrames.push(poppedWindow);
      }
      exports.CloseTab(id);

    }

    function popoutCurFrame() {
      if (exports.curframe) { popoutFrame(exports.curframe); }
    }

    function getUrlFromInfo(info) {
      if (info.url) {
        // TODO: parse localhost, here
        var parts = info.url.split('//');
        if (parts.length === 1) {
          parts = ['', parts[0]];
        }

        // parse localhost properly
        var pathParts = parts[1].split('/');
        var portParts = pathParts[0].split(':');
        if (portParts[0] === 'localhost' || portParts[0] === '127.0.0.1') {
          var domainParts = document.domain.split('.');
          if (portParts[1]) {
            domainParts[0] = domainParts[0] + (useDashForPort ? '-' : ':') + portParts[1];
          }
          pathParts[0] = domainParts.join('.');
          parts[1] = pathParts.join('/');
        }

        return parts.join('//');
      }
    }

    function reloadCurFrame() {
      if (!exports.curframe) { return; }
      var info = exports.frames[exports.curframe];

      var url = getUrlFromInfo(info);

      $('#html_url_input').val(info.url);

      if (url) {
        info.iframe.show();
        info.iframe.attr('src', url);
        for(var i in poppedFrames) {
          poppedFrames[i].location.reload();
        }
      }
    }

    function handleMessage(mess) {
      if (mess.type === 'set_frame') {
        setFrame(mess.id, mess.info);
      } else if (mess.type === 'set_frames') {
        for (var id in mess.frames) {
          setFrame(id, mess.frames[id]);
        }
        for (var id2 in exports.frames) {
          if (!(id2 in mess.frames)) {
            closeFrame(id2);
          }
        }
      } else if (mess.type === 'close_frame') {
        closeFrame(mess.id);
      } else if (mess.type === 'reload_frame') {
        reloadCurFrame();
      } else if (mess.type === 'prefetch_frame') {
        checkPrefetchedFrame(mess.id, mess.info);
      } else if (mess.type !== 'hello') {
        /* eslint-disable no-console */
        console.log('UNHEARD MESSAGE', mess);
        /* eslint-enable no-console */
      }
    }
  });

})(HtmlManager);

