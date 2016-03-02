/* globals _SERVE_FILES_PATH, io, _, Terminal, GlobalHotkeyManager, TerminalManager */

(function(exports) {
  exports.show();

  window.onload = function() {
    var socket = io.connect('/terminal'); // terminal socket is on a different channel

    var cols = 80, rows = 50; // used in newTerm
    var waitingForNewTerm = false;

    var $shell = $('#shell_container');
    var $info = $shell.find('.info_pane');
    var $presence = $info.find('.users-indicator');
    var $lock = $info.find('.lock-button');
    var $dimensions = $info.find('.dimensions');
    var $tabs = $shell.find('#tablist')
      .append($('<div>')
        .addClass('tab newtab')
        .click(newTerm)
        .append($('<span>')
          .text('+')
        )
      );
    var $res = $shell.find('#resizable');
    var $loading = $res.find('.loading');
    $shell.find('.empty_newtab').click(newTerm);

    var clientId;
    var delayedResize = _.throttle(updateTermSize, 100);
    var resizeCompatibilityMode = true;
    var resizeLock = !resizeCompatibilityMode;
    var resizeLeader = false;

    // Objects
    /* eslint-disable camelcase */
    exports.all_tabs = {}; // id -> Terminal
    exports.selected_term = null; // id
    exports.data_queue = {};
    /* eslint-enable camelcase */
    exports.socket = socket;

    // Methods
    exports.curTerm = getTerm;
    exports.SelectTab = selectTab;
    exports.NextTab = switchTab(1);
    exports.PrevTab = switchTab(-1);
    exports.destroyTerm = destroyTerm;
    exports.CloseCurTab = closeCurTab;
    exports.resizeTerm = resizeTerm;
    exports.focusContent = focusContent;
    exports.blurContent = blurContent;
    exports.resetTab = resetTab;
    exports.newTerm = newTerm;
    exports.newTab = newTerm;

    // Socket events
    socket.on('connect', onconnect);
    socket.on('id', onclientid);
    socket.on('list_tabs', onlist_tabs);
    socket.on('resize', onresize);
    socket.on('presence', onpresence);
    socket.on('sync', onsync);
    socket.on('data', ondata);
    socket.on('reset', onreset);

    // DOM events
    $('#shell_container').on('resize', delayedResize);
    $(window).on('resize', delayedResize);
    $lock.click(function() {
      var opts = { force: true };
      if (resizeLock && resizeLeader) { opts.release = true; }

      updateTermSize(opts);
    });

    // Infopane functions
    $info.compatibility = function() {
      resizeCompatibilityMode = false; // Server has updated resize logic
      $info.find('.compatibility-mode').removeClass('compatibility-mode');
    };
    $info.empty = function(isEmpty) { this.toggleClass('hidden', isEmpty); };
    $info.presence = function(isMany) {
      if (!isMany) {
        resizeLock = false;
        resizeLeader = false;
      }
      $presence.toggleClass('many', isMany);
      $lock.toggleClass('many', isMany);
    };
    $info.lock = function(isLocked, isLeader) {
      resizeLock = isLocked;
      resizeLeader = isLeader;
      toggleClass.call($lock, 'lock', isLocked);
      toggleClass.call($lock, 'leader', isLeader);
    };
    $info.dimensions = function(cols, rows) { $dimensions.html([cols, rows].join('&times;')); };

    // Infopane tooltips
    tooltip.call($lock.find('.lock'), function() {
      if (resizeLeader) {
        return { state: 'The shell is locked to your tab\'s size.', action: 'Click to relinquish control.' };
      } else {
        return { state: 'The shell is locked to someone else\'s tab\'s size.', action: 'Click to claim control.' };
      }
    });
    tooltip.call(
      $lock.find('.unlock'),
      'The shell will change size when any viewer\'s tab changes.',
      'Click to lock it to your tab\'s size.'
    );
    tooltip.call($presence.find('.one'), 'You are the only one viewing this tab.');
    tooltip.call($presence.find('.many'), 'Multiple people are viewing this tab.');

    function tooltip(state, action) {
      var text;
      if (typeof state === 'function') { // state/action are functions
        text = function() {
          var data = state();
          var text = data.state;
          if (data.action) { text += '<br/><span class="tooltip-subtitle">' + data.action + '</span>'; }
          return text;
        };
      } else { // state/action are strings
        text = state;
        if (action) { text += '<br/><span class="tooltip-subtitle">' + action + '</span>'; }
      }

      this.tooltip({
        animation: true,
        html: true,
        placement: 'bottom',
        title: text,
      });
    }

    // Avoid animations from jQueryUI
    function toggleClass(className, add) {
      var present = this.hasClass(className);
      var classList = this.attr('class');
      classList = classList.length ? classList.split(' ') : [];

      if (add && !present) {
        classList.push(className);
      } else if (!add && present) {
        var i = classList.indexOf(className);
        classList.splice(i, 1);
      } else {
        return;
      }

      classList = classList.join(' ');
      this.attr('class', classList);
    }

    // Internal functions
    function isTerm(term) {
      return (term instanceof Terminal);
    }

    function getTerm(term) {
      term = term || exports.selected_term && exports.all_tabs[exports.selected_term];
      return isTerm(term) ? term : undefined;
    }

    function selectedTerm(term) {
      return isTerm(term) && getTerm() === term;
    }

    function getCharRuler(term) {
      var charRuler = term.charRuler;

      // Create an empirical ruler for the terminal
      if (!charRuler) {
        charRuler = document.createElement('div');
        charRuler.innerHTML = '0123456789ABCDE!{}|?';
        charRuler.style.position = 'absolute';
        charRuler.style.visibility = 'hidden';
        term.element.appendChild(charRuler);
        term.charRuler = charRuler;
      }

      // Recalculate dimensions based on current terminal size
      charRuler.charWidth = charRuler.getBoundingClientRect().width / 20.0;
      charRuler.charHeight = Math.max(charRuler.getBoundingClientRect().height - 1, 0); // -1 for css margin-top

      return charRuler;
    }

    function MakeTabs() {
      var tabs = exports.all_tabs;

      $tabs.children('.term').remove();
      for (var i in tabs) { $tabs.append(getButton(i)); }

      // Set visibility of the terminals content div
      if (_.size(tabs) === 0) {
        // This will expose the 'No terminals open' div
        $res.hide();
        $info.empty(true);
      } else {
        $info.empty(false);
        $res.show();
      }

      function getButton(name) {
        var $title = $('<span>')
          .addClass('tab_title')
          .text(name);
        var $close = $('<span>')
          .addClass('closetab')
          .html('&times;')
          .click(destroyTab);
        var $button = $('<div>')
          .addClass('tab term')
          // TODO: Move this to stylesheet
          .css('text-align', 'center')
          .click(selectTab.bind(null, name))
          .append($title)
          .append($close);

        if (name === exports.selected_term) { $button.addClass('active'); }

        return $button;

        function destroyTab(e) {
          e.stopPropagation();

          if (name === exports.selected_term) {
            closeCurTab();
          } else {
            destroyTerm(name);
          }
        }
      }
    }

    // Exported methods
    function selectTab(id) {
      var el;
      // Hide unselected tabs
      for(var i in exports.all_tabs) {
        if ((el = exports.all_tabs[i].element)) { el.style.display = 'none'; }
      }

      /* eslint-disable camelcase */
      exports.selected_term = id;
      /* eslint-enable camelcase */
      var term = getTerm();

      if (!term) {
        $res.append($loading); // Display the loading spinner
      } else {
        $loading.detach();
        term.element.style.display = 'block';
        term.focus();
        resizeLock = !resizeCompatibilityMode;
        resizeLeader = false;
        updateTermSize();
      }

      MakeTabs(); // Color the tab as active
    }

    function switchTab(diff) {
      return function() {
        var tabs = [];
        var index = null;

        // Tally the tabs
        for (var i in exports.all_tabs) {
          if (i === exports.selected_term) { index = tabs.length; }
          tabs.push(i);
        }

        // Select the new tab
        if (index !== null) {
          var newIndex = (index + diff + tabs.length) % tabs.length;
          var selectedTab = tabs[newIndex];
          selectTab(selectedTab);
        }
      };
    }

    function destroyTerm(id) {
      socket.emit('destroy', id);
    }

    function closeCurTab() {
      if (exports.selected_term === null) { return; }

      // Close the current tab
      destroyTerm(exports.selected_term);

      // choose the next open tab
      var nextTab = null;
      var breaknext = false;
      for (var tabId in exports.all_tabs) {
        if (breaknext) {
          nextTab = tabId;
          break;
        }
        if (tabId === exports.selected_term) {
          breaknext = true;
        } else {
          nextTab = tabId;
        }
      }
      if (nextTab) {
        selectTab(nextTab);
      } else {
        $info.empty(true);
      }
    }

    function updateTermSize(opts) {
      opts = opts || {};
      var term = getTerm();
      if (!term) { return; }

      var charRuler = getCharRuler(term);
      if (charRuler.charWidth <= 0 || charRuler.charHeight <= 0 ) { return; }

      var rect = $res[0].getBoundingClientRect();
      var args = {
        id: term.id,
        // Defaulting to 0 prevents NaN
        cols: Math.floor(rect.width / charRuler.charWidth) || 0,
        rows: Math.floor(rect.height / charRuler.charHeight) || 0,
        force: opts.force,
        release: opts.release,
      };

      resizeTerm(args);
    }

    function resizeTerm(data) {
      var term = getTerm();
      if (!term || data.cols < 2) { return; }

      // Claim resizeLeader before resizing (compatibility mode)
      if (resizeCompatibilityMode) { socket.emit('md', data.id); }
      socket.emit('resize', data);

      // Only resize if we have control
      if (!resizeLock || resizeLock && resizeLeader || data.force || resizeCompatibilityMode) {
        resize(term, data.cols, data.rows);
      }
    }

    function resize(term, cols, rows) {
      if (selectedTerm(term)) { $info.dimensions(cols, rows); }

      term.resize(cols, rows);
      $(term.element).css('width', Math.floor(cols * getCharRuler(term).charWidth));
    }

    function focusContent() {
      var term = getTerm();
      if (term) { term.focus(); }
    }

    function blurContent() {
      var term = getTerm();
      if (term) { term.blur(); }
    }

    function resetTab() {
      var term = getTerm();
      if (!term) { return; }

      var ESCAPE = '\x1b';
      var currentCol = term.x + 1;

      // Capture the current line to be echoed
      var currentLine = term.lines[term.ybase + term.y];
      var textLine = '';
      for (var i in currentLine) {
        textLine += currentLine[i][1];
      }

      // Reset terminal, replay line, restore cursor
      term.write(ESCAPE + 'c');
      term.write(textLine);
      term.write(ESCAPE + '[1;' + currentCol + 'H');
      term.showCursor();
    }

    function newTerm() {
      waitingForNewTerm = true;
      socket.emit('new_term', { cols: cols, rows: rows });
    }

    // Socket event handlers
    function onconnect() {
      socket.emit('sync_tabs');
      // TODO: destroy on connect, not disconnect
      // Size the window once it is created
      setTimeout(delayedResize, 1000);
    }

    function onclientid(msg) {
      $info.compatibility();
      clientId = msg;
    }

    /* eslint-disable camelcase */
    function onlist_tabs(tabs) {
    /* eslint-enable camelcase */
      var i;
      var term;

      // Sync all tabs
      for (i in tabs) {
        if (!exports.all_tabs[i]) { socket.emit('sync', i); }
      }

      // Delete tabs that no longer exist
      for (i in exports.all_tabs) {
        if (!tabs[i]) {
          term = exports.all_tabs[i];
          if (isTerm(term)) { term.destroy(); }
          delete exports.all_tabs[i];
        }
      }

      // Select some tab
      if (!exports.selected_term || !getTerm()) {
        /* eslint-disable camelcase */
        exports.selected_term = null;
        /* eslint-enable camelcase */
        for (i in exports.all_tabs) {
          selectTab(i);
          break;
        }
      }

      // Set tabs for preloading
      /* eslint-disable camelcase */
      exports.all_tabs = _.extend(tabs, exports.all_tabs);
      /* eslint-enable camelcase */
      MakeTabs();
    }

    function ondata(msg) {
      var term = exports.all_tabs[msg.id];

      if (isTerm(term)) {
        term.write(msg.d);
      } else if (exports.data_queue[msg.id]) {
        exports.data_queue[msg.id].push(msg);
      } else {
        exports.data_queue[msg.id] = [msg];
      }
    }

    function onresize(msg) {
      var term = exports.all_tabs[msg.id];

      if (isTerm(term)) {
        if (selectedTerm(term)) { $info.lock(msg.leader, msg.leader === clientId); }
        resize(term, msg.cols, msg.rows);
      }
    }

    function onpresence(msg) {
      var term = exports.all_tabs[msg.id];

      if (selectedTerm(term)) { $info.presence(msg.presence); }
    }

    function onreset(msg) {
      var term = exports.all_tabs[msg.id];

      if (isTerm(term)) {
        term.write('\x1bc');
        term.showCursor();
      }
    }

    function onsync(id, path) {
      var tries = 0;

      if (!exports.selected_term) { selectTab(id); }

      if (waitingForNewTerm && !isTerm(exports.all_tabs[id])) {
        waitingForNewTerm = false;
        selectTab(id);
      }

      (function syncTab(id, path) {
        /* eslint-disable no-console */
        if (++tries > 10) { return console.error('Could not sync tab', id, path); }
        /* eslint-enable no-console */

        $.ajax({
              dataType: 'json',
              url: _SERVE_FILES_PATH + dirname + '/' + path,
              timeout: 20 * 1000, // 20 s
              success: success,
              error: syncTab.bind(null, id, path),
        });

        function success(state) {
          var term = exports.all_tabs[id];

          if (isTerm(term)) { term.destroy(); }

          Terminal.pasteMode = +GlobalHotkeyManager.keySettings.pasteMode;
          console.log(typeof state.serialization);
          term = new Terminal(state.serialization);
          term.send = function() {};
          term.load(state.serialization); // deserialization
          term.id = id;
          term.on('data', function(data) {
            socket.emit('data', {
              id: term.id,
              d: data,
            });
          });
          term.on('title', function(title) {
            document.title = title;
          });

          // Open it hidden
          term.open($('#resizable')[0], true);
          exports.all_tabs[id] = term;

          // Reselect to ensure the size is updated and the loading icon goes away
          if (id === exports.selected_term) { exports.SelectTab(id); }

          // Replay queued data
          var q = exports.data_queue[id];
          for(var i in q) {
            if (q[i].n >= term.n) {
              term.write(q[i].d);
            }
          }
          delete exports.data_queue[id];

          term.showCursor();
        }
      }(id, path));
    }
  };
})(TerminalManager);
