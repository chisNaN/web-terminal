/* globals user, uuid, get_socket, ChatManager, HtmlManager, _ */

(function(exports, browser) {
  var socket = get_socket('chat');

  // One-off to persist state
  // FIXME: Patch layout framework or migrate
  var isHidden = true;
  try {
    isHidden = JSON.parse(localStorage.layout_is_hidden).chat_container;
  } catch(e) {}
  // Hide unless the server plugin is present
  exports.hide();

  $(document).ready(function(){
    var isInit = false;
    var daymarkers = {};

    var $conversation = exports.panel.find('ul#conversation');
    var $messageAlert = exports.panel.find('#message-alert');
    var $load = exports.panel.find('.load-older a');
    var $purge = exports.panel.find('.purge a');
    var $rtc = exports.panel.find('.rtc a');
    var $messageForm = exports.panel.find('form.chat-input');
    var $message = $messageForm.find('[name="message"]');
    var $nameForm = exports.panel.find('form.chat-name');
    var $name = $nameForm.find('[name="name"]');

    // TODO: Add user.gravatar to display
    var oldest = null;

    if (!browser) { $rtc.parent().hide(); }

    $load.click(onload);
    $purge.click(onpurge);
    $rtc.click(onrtc);
    $messageForm.submit(onsubmit);
    $message.on('keydown', onkeydown);
    $nameForm.submit(onNameSubmit);

    socket.on('message', onmessage);

    onload();

    if (createUsername) {
      $messageForm.hide();
      $nameForm.show();
    }

    function onload() {
      socket.emit('message', {
        from: 'chat',
        to: 'computer',
        type: 'load',
        timestamp: oldest && oldest.toISOString(),
      }, load);
    }

    function onpurge() {
      socket.emit('message', {
        from: 'chat',
        to: 'computer',
        type: 'purge',
      }, purge);
    }

    function onrtc() {
      var hasRtc = _.chain(browser.frames)
        .map(function(frame) { return frame.url; })
        .filter(function(url) { return url && url.match(/https:\/\/apprtc\.appspot\.com\/r\/\w+/); })
        .value()
        .length;

      if (hasRtc) {
        browser.open();
      } else {
        var rtcSite = 'https://apprtc.appspot.com/r/' + uuid().replace(/-/g, '');
        browser.new_frame({ url: rtcSite });
      }
    }

    function onsubmit(e) {
      e.stopPropagation();
      e.preventDefault();

      var message = $message.val();
      $message.val('');
      if (!message) { return; }

      publish(uuid(), message);
    }

    var username;
    function onNameSubmit(e) {
      e.stopPropagation();
      e.preventDefault();

      var name = $name.val();
      $name.val('');
      username = name;
      $messageForm.show();
      $nameForm.hide();
    }

    function onmessage(msg) {
      if (msg.type === 'publish') {
        display(msg.message, true);
      } else if (msg.type === 'purge') {
        clearIds();
      } else if (!isInit && msg.type === 'show') {
        isInit = true;
        exports.show();
        if (!isHidden) { exports.open(); }
      }
    }

    function onkeydown(e) {
      if (e.which === 13 && !e.shiftKey) { onsubmit(e); }
    }

    function load(messages) {
      if (messages.length) {
        var time = new Date(messages[messages.length - 1].time);
        if (time < oldest || !oldest) { oldest = time; }
      }

      messages.forEach(function(msg) { display(msg); });
    }

    function purge() {
      $conversation.find('li').remove();
      daymarkers = {};
      $messageAlert.hide();
      oldest = null;
      onload();
    }

    function clearIds() {
      $conversation
        .find('li')
        .each(function() {
          var id = $(this).attr('data-id');
          // uuid is 36, so < 24 to be safe
          if (id && id.length < 24) {
            $(this).attr('data-id', 'purged');
          }
        });
    }

    function publish(id, message, $chat) {
      var data = {
        id: id,
        originator: user && user.username || username,
        message: message,
      };
      $chat = $chat || display(data, true, true);
      $chat.addClass('pending');

      // Consider the message idle after 3s
      var timeoutId = setTimeout($chat.addClass.bind($chat, 'stale'), 3000);

      socket.emit('message', {
        from: 'chat',
        to: 'computer',
        type: 'publish',
        originator: data.originator,
        message: data.message,
      }, clearPending.bind($chat, timeoutId));
    }

    function clearPending(timeoutId, id) {
      clearTimeout(timeoutId);
      $(this).removeClass('pending stale');
      $(this).find('.stale, .pending').remove();
      $(this).attr('data-id', id);
    }

    function display(data, isRecent, isMine) {
      var id = data.rowid || data.id;
      var originator = data.originator;
      var message = data.message;
      var time = data.time;
      var isFound = false;
      var isScrolled = isVisible($conversation.find('.message:last'));

      var timestamp = time && Date.parse(time);
      // Find the chat, if it already exists
      var $chat = $conversation.find('li[data-id=' + id + ']:first');

      if (!$chat.length) {
        $chat = makeChat(isMine);
      } else {
        isFound = true;
      }


      $chat.attr('data-id', id);
      $chat.find('.name').text(originator);
      var $content = $chat.find('.content');
      $content.empty().append.apply($content, textToNodes(message));

      if (!timestamp) { // the $chat was just sent by the user
        $conversation.append($chat);
      } else { // the $chat is coming from the server
        var date = new Date(timestamp);
        var timestring = date.toLocaleTimeString();
        var datestring = date.toLocaleDateString();

        $chat.find('.timestamp time').text(timestring);
        $chat.attr('timestamp', timestamp);

        // Find insertion point O(n)
        var priorEl = null;
        if (isRecent) {
          priorEl = findPriorFromMostRecent(timestamp);
        } else {
          priorEl = findPriorFromLeastRecent(timestamp);
        }

        // Add a daymarker
        var $daymarker = daymarkers[datestring];
        if (!$daymarker) {
          $daymarker = makeDaymarker(datestring);
          daymarkers[datestring] = $daymarker;
          if (priorEl) {
            $(priorEl).after($daymarker);
            priorEl = $daymarker;
          }
        }
        if (!priorEl) {
          $conversation.prepend($daymarker);
          priorEl = $daymarker;
        }

        // Insert element
        if (priorEl !== $chat[0]) {
          $(priorEl).after($chat);
        }
      }

      if (isMine) {
        scrollToBottom();
      } else if (isRecent && !isFound) {
        // Only scroll to the bottom if we were already there
        if (isScrolled) {
          scrollToBottom();
        } else if ($messageAlert.is(':hidden')) {
          $messageAlert.show();
          $conversation.scroll(_.throttle(function() {
            if (isVisible($conversation.find('.message:last'))) {
              $messageAlert.hide();
              $conversation.off('scroll');
            }
          }, 100));
        }
      }

      return $chat;

      function isVisible($el) {
        return $el.length ? $el.position().top < $el.offsetParent().height() : true;
      }

      function scrollToBottom() {
        $conversation.scrollTop($conversation.prop('scrollHeight'));
      }

      function textToNodes(text) {
        return text.split('\n').map(function(text) {
          return $('<p>').text(text);
        });
      }

      function findPriorFromMostRecent(timestamp) {
        var $chats = $conversation.find('li.message[timestamp]');
        var i = $chats.length - 1;
        for (; i >= 0; i--) {
          var liTimestamp = +$chats[i].getAttribute('timestamp');
          if (liTimestamp < timestamp) { break; }
        }
        return i >= 0 ? $chats[i] : null;
      }

      function findPriorFromLeastRecent(timestamp) {
        var $chats = $conversation.find('li.message[timestamp]');
        var i = 0;
        for (; i < $chats.length; i++) {
          var liTimestamp = +$chats[i].getAttribute('timestamp');
          if (liTimestamp > timestamp) { break; }
        }
        return i > 0 && i < $chats.length ? $chats[i - 1] : null;
      }
    }

    function makeDaymarker(datestring) {
      return $('<li class="day-marker">').append($('<time>').text(datestring));
    }

    function makeChat(isMine) {
      var $chat = $('<li class="message">');
      var $callsign = $('<span class="callsign">')
        .append('<span class="name">')
        .append(
          $('<span class="timestamp">')
            .append('<time>')
        );
      var $content = $('<div class="content">');
      var $stale;
      var $pending;

      if (isMine) {
        $stale = $('<span class="stale">')
          .append($('<a class="resend">')
            .text('Resend')
            .click(function() {
              $chat.removeClass('stale');
              var content = $content.text();
              var id = $chat.attr('data-id');
              publish(id, content, $chat);
            })
          )
          .append($('<a class="cancel">')
            .text('Cancel')
            .click(function() { $chat.remove(); })
          );
        $pending = $('<span class="pending"><i class="fa fa-fw fa-cog fa-spin">');
      }

      $chat
        .append(
          $('<div>')
            // Appending `undefined` does nothing, in the case of `!isMine`
            .append($callsign)
            .append($stale)
            .append($pending)
        )
        .append($content);

      return $chat;
    }
  });
})(ChatManager, HtmlManager);
