/* jshint -W117 */

var hotkeysHandler = function(hotkeys, defaultHotkeys, keySettings, defaultKeySettings, save) {
  var taken = {};

  var hotkeyClick =  function(){
    var $self = $(this);
    var previous = $self.val();
    $self.val('Press desired hotkey');

    var keys = {};
    $self.keydown(function(event){
      event.preventDefault();

      delete taken[previous];
      var ctrl_keys = [];
      if (event.altKey) {
        ctrl_keys.push('alt');
      }
      if (event.ctrlKey) {
        ctrl_keys.push('ctrl');
      }
      if (event.shiftKey) {
        ctrl_keys.push('shift');
      }
      if (event.metaKey) {
        if (utils.is_mac) {
          ctrl_keys.push('cmd');
        }
      }

      if ((event.keyCode > 47 && event.keyCode < 58) || // These map to [0-9]
          (event.keyCode > 64 && event.keyCode < 91)) {// These map to [a-z]
        var key = String.fromCharCode(event.keyCode);
        keys[key] = true;
      }

      if ((binding = GlobalHotkeyManager.specialKeys[event.keyCode])) {
        keys[binding] = true;
      }

      if (event.keyCode > 111 && event.keyCode < 124) {
        keys['f' + (event.keyCode - 111)] = true;
      }
      $self.val(ctrl_keys.concat(Object.keys(keys)).join('+'));
      $self.off('keyup');
      // save on keyup
      $self.keyup(function(event) {
        event.preventDefault();
        event.stopPropagation();
        var $self = $(this);
        $self.off('keydown');
        $self.off('keyup');
        var data_manager = $self.attr('data-manager');
        var data_command = $self.attr('data-command');
        if (!taken[$self.val()]) {
          delete taken[previous];
          taken[$self.val()] = true;
          $self.off('blur');
          $self.blur();
        } else {
          $self.off('blur');
          $self.blur();
          $self.val('That hotkey has already been assigned');
          $self.css('color', 'red');
          setTimeout(function() {
            $self.val(hotkeys[data_manager][data_command]);
            $self.css('color', 'black');
          }, 1000);
        }
      });
    });
    // reverts hotkey if user clicks away
    $self.blur(function(){
      var $self = $(this);
      $self.off('keydown');
      $self.val(previous);
    });
  };

  var hotkeys_div = $('<div>')
    .addClass('hotkeys-div');
  var hotkeys_config = $('<div>')
    .addClass('hotkeys-config');

  function addHotkeyField(hotkey, manager, command, bindings_div) {
    if(bindings_div.find('input').length) {
      bindings_div.append($('<hr>').addClass('hotkey-field-hr'));
    }
    var binding_input;

    if (hotkey) {
      binding_input = $('<input>').addClass('binding-input')
        .attr('data-manager', manager)
        .attr('data-command', command)
        .val(hotkey);
      binding_input.click(hotkeyClick);
      bindings_div.append(binding_input);

      var delete_div = $('<div>')
        .addClass('hotkey-delete fa fa-fw fa-trash-o');
      delete_div.click(function(){
        command = $(this).prev().attr('data-command');
        manager = $(this).prev().attr('data-manager');
        if ($('*[data-command="' + command + '"]*[data-manager="' + manager + '"]').length > 1) {
          $(this).prev().remove();
          $(this).remove();
        } else {
          $(this).prev().val('');
        }
      });
      bindings_div.append(delete_div);
      return binding_input;
    }
    return null;
  }

  function add_input(){
    command = $(this).attr('data-command');
    manager = $(this).attr('data-manager');
    var bindings_div = $(this).parent().parent().find('.bindings-div').eq(0);
    var binding_input = addHotkeyField(' ', manager, command, bindings_div);
    if (binding_input) {
      binding_input.trigger('click');
      binding_input.focus();
      binding_input.off('blur');
      binding_input.blur(function(){
        $(this).next().remove();
        $(this).remove();
      });
    }
  }

  for (var manager in hotkeys) {
    var manager_div = $('<div>')
      .addClass('manager-div')
      .text(manager);
    hotkeys_config.append(manager_div);
    for (var command in hotkeys[manager]) {
      taken[hotkeys[manager][command]] = true;
      var hotkey_div = $('<div>')
        .addClass('hotkey-div');
      var command_container = $('<div>')
        .addClass('command-container');
      var command_div = $('<div>')
        .addClass('command-div')
        .text(command);
      var add_div = $('<div>')
        .addClass('add-div')
        .attr('data-command', command)
        .attr('data-manager', manager)
        .addClass('fa fa-fw fa-plus-square-o');
      add_div.click(add_input);
      command_container.append(command_div);
      command_container.append(add_div);
      var bindings_div = $('<div>')
        .addClass('bindings-div');

      if (!(Array.isArray(hotkeys[manager][command]))) {
        hotkeys[manager][command] = [hotkeys[manager][command]];
      }
      for (var i=0; i<hotkeys[manager][command].length;i ++) {
        addHotkeyField(hotkeys[manager][command][i], manager, command, bindings_div);
      }

      hotkey_div.append(command_container);
      hotkey_div.append(bindings_div);
      hotkeys_config.append(hotkey_div);
    }
  }

  hotkeys_div.append(hotkeys_config);
  hotkeys_div.append(
    $('<div>')
      .addClass('hotkeys-message')
  );
  if (defaultHotkeys) {
    hotkeys_div.append(
      $('<div>').append($('<a>')
        .addClass('add-defaults')
        .text('Load defaults')
        .click(function() {
          $('.binding-input').each(function(){
            var data_manager = $(this).attr('data-manager');
            var data_command = $(this).attr('data-command');
            $(this).val(defaultHotkeys[data_manager][data_command]);
          });
        })
      )
      .add('add-defaults-container')
    );
  }


  hotkeys_div.append($('<br/>'));
  if (keySettings) {
    if (utils.is_mac) {
      var altBehaviorCheck = $('<input>').attr('type', 'checkbox');
      if (keySettings.altBehavior) { altBehaviorCheck.prop('checked', true); }
      hotkeys_div.append(
        $('<div>')
          .append(altBehaviorCheck)
          .append('&nbsp; Alt acts as +Esc')
      );
    } else {
      // TODO: Move this to terminal configuration when the UX changes
      var pasteModeCheck = $('<div>')
        .addClass('paste-mode-check')
        .text('When in a terminal application (e.g. emacs):')
        .append($('<br>'))
        .append($('<input>')
          .attr('name', 'pasteMode')
          .attr('type', 'radio')
          .attr('value', 0)
        )
        .append('&nbsp; Ctrl+V pastes normally')
        .append($('<br>'))
        .append($('<input>')
          .attr('name', 'pasteMode')
          .attr('type', 'radio')
          .attr('value', 1)
        )
        .append ('&nbsp; Ctrl+Shift+V pastes')
        .append($('<br>'))
        .append($('<input>')
          .attr('name', 'pasteMode')
          .attr('type', 'radio')
          .attr('value', 2)
        )
        .append('&nbsp; Neither Ctrl+V nor Ctrl+Shift+V paste');
      if (!keySettings.pasteMode) {
        keySettings.pasteMode = defaultKeySettings.pasteMode;
      }
      pasteModeCheck
        .find('input[value="' + keySettings.pasteMode + '"]')
        .prop('checked', true);
      hotkeys_div.append(
        $('<div>').append(pasteModeCheck)
      );
    }
  }
  hotkeys_div.append($('<br/>'));
  hotkeys_div.append(
    $('<button>').addClass('btn btn-default').text('Cancel').click(function() {
      hide_main_modal();
    })
  );
  hotkeys_div.append(
    '&nbsp; '
  );
  hotkeys_div.append(
    $('<button>').addClass('btn btn-primary').text('Submit').click(function(){
      var hotkeys = {};
      $('.binding-input').each(function() {
        var data_manager = $(this).attr('data-manager');
        var data_command = $(this).attr('data-command');
        if (!hotkeys[data_manager]) {
          hotkeys[data_manager] = {};
        }
        if (!hotkeys[data_manager][data_command]) {
          hotkeys[data_manager][data_command] = [$(this).val()];
        } else {
          hotkeys[data_manager][data_command].push($(this).val());
        }
      });

      if (utils.is_mac) {
        if (altBehaviorCheck.prop('checked')) {
          keySettings.altBehavior = 'escape';
        } else {
          keySettings.altBehavior = '';
        }
      } else {
        keySettings.pasteMode = $('.paste-mode-check').find('input:checked').val();
      }
      save(hotkeys, keySettings);
    })
  );
  show_main_modal(hotkeys_div);
};

(function() {

  function getDefaultHotkeys() {
    var main_key = (utils.is_mac) ? 'cmd' : 'ctrl';
    var defaults = {};
    defaults.global = {
      prevpane: ['alt+' + main_key + '+J'],
      nextpane: ['alt+' + main_key + '+K'],
      newtab: ['alt+T'],
      prevtab: ['alt+J'],
      nexttab: ['alt+K'],
      closetab: ['alt+W'],
      toggle_maximize:    ['alt+M'],
      focus_files:    ['alt+1'],
      focus_editor:   ['alt+2'],
      focus_terminal: ['alt+3'],
      focus_html:     ['alt+4'],
      focus_chat:     ['alt+5'],
      focus_graph:    ['alt+6'],
      toggle_files:    ['alt+shift+1'],
      toggle_editor:   ['alt+shift+2'],
      toggle_terminal: ['alt+shift+3'],
      toggle_html:     ['alt+shift+4'],
      toggle_chat:     ['alt+shift+5'],
      toggle_graph:    ['alt+shift+6'],
    };
    defaults[PanelNames.Terminal] = {
      reset_tab: ['alt+R'],
    };
    defaults[PanelNames.Graph] = {
      save:  [main_key+'+S'],
      share: [main_key+'+H'],
      reset: [main_key+'+R'],
    };
    defaults[PanelNames.Files] = {
      newfile:   [main_key+'+F'],
      newfolder: [main_key+'+shift+F'],
    };
    defaults[PanelNames.Editor] = {
      save:     [main_key+'+S'],
      run:      [main_key+'+R'],
      reload:   [main_key+'+E'],
      newfile:  [main_key+'+F'],
    };
      defaults[PanelNames.Html] = {
      reload: [main_key+'+R'],
      popout: [main_key+'+P'],
    };
    return defaults;
  }

  var defaultKeySettings = {
    altBehavior: 'escape',
    pasteMode: 0
  };

  function registerAllHotkeys() {
    if (localStorage) {localStorage.hotkeys = JSON.stringify(hotkeys);}

    GlobalHotkeyManager.unregisterAll();
    for (var name in Managers) {
      Managers[name].unregisterAll();
      // tell each manager their set of hotkeys, by name, so that they can create tooltips
      Managers[name].hotkey_mapping = hotkeys[name];
    }

    function PaneSwitchMaker(diff) {
      return function() {
        var open_panes = [];
        var index = null;
        for (var name in Managers) {
          var pane = Managers[name];
          if (pane.opened) {
            if (pane.focused()) {
              index = open_panes.length;
            }
            open_panes.push(pane);
          }
        }
        if (!open_panes.length) {return;}

        var new_index = 0;
        if (index !== null) {
          new_index = (index + diff + open_panes.length) % open_panes.length;
        }
        open_panes[new_index].focus();
      };
    }

    GlobalHotkeyManager.registerHotkeys(hotkeys.global.prevpane, PaneSwitchMaker(-1));
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.nextpane, PaneSwitchMaker(1));

    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_maximize,  function() {
      for (var name in Managers) {
        if (Managers[name].focused()) {
          Managers[name].toggle_maximize();
        }
      }
    });

    GlobalHotkeyManager.registerHotkeys(hotkeys.global.focus_terminal,  function() {TerminalManager.focus();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.focus_editor,    function() {EditorManager.focus();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.focus_files,     function() {FilesManager.focus();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.focus_html,      function() {HtmlManager.focus();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.focus_graph,     function() {GraphManager.focus();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.focus_chat,      function() {ChatManager.focus();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_terminal, function() {TerminalManager.toggle();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_editor,   function() {EditorManager.toggle();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_files,    function() {FilesManager.toggle();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_html,     function() {HtmlManager.toggle();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_graph,    function() {GraphManager.toggle();});
    GlobalHotkeyManager.registerHotkeys(hotkeys.global.toggle_chat,     function() {ChatManager.toggle();});

    function registerSwitchTabs(manager) {
      manager.registerHotkeys(
        hotkeys[manager.name].prevtab || hotkeys.global.prevtab,
        function() {
          if (this.PrevTab) { this.PrevTab(); }
        }
      );

      manager.registerHotkeys(
        hotkeys[manager.name].nexttab || hotkeys.global.nexttab,
        function() {
          if (this.NextTab) { this.NextTab(); }
        }
      );
    }
    registerSwitchTabs(EditorManager);
    registerSwitchTabs(GraphManager);
    registerSwitchTabs(TerminalManager);
    registerSwitchTabs(HtmlManager);

    function registerCloseTab(manager) {
      manager.registerHotkeys(
        hotkeys[manager.name].closetab ||  hotkeys.global.closetab,
        function() {
          if (this.CloseCurTab) { this.CloseCurTab(); }
        }
      );
    }
    registerCloseTab(EditorManager);
    registerCloseTab(TerminalManager);
    registerCloseTab(HtmlManager);

    function registerNewTab(manager) {
      manager.registerHotkeys(
        hotkeys[manager.name].newtab ||  hotkeys.global.newtab,
        function() {
          if (this.newTab) { this.newTab(); }
        }
      );
    }
    registerNewTab(TerminalManager);
    registerNewTab(HtmlManager);

    FilesManager.registerHotkeys(hotkeys[PanelNames.Files].newfile, function() {this.newFile();});
    FilesManager.registerHotkeys(hotkeys[PanelNames.Files].newfolder, function() {this.newFolder();});
    EditorManager.registerHotkeys(hotkeys[PanelNames.Editor].save, function() {this.saveCurrent();});
    EditorManager.registerHotkeys(hotkeys[PanelNames.Editor].run, function() {this.runCurrent();});
    EditorManager.registerHotkeys(hotkeys[PanelNames.Editor].reload, function() {this.reloadCurrent();});
    EditorManager.registerHotkeys(hotkeys[PanelNames.Editor].newfile, function() {this.newFile();});
    TerminalManager.registerHotkeys(hotkeys[PanelNames.Terminal].reset_tab, function() {this.resetTab();});
    HtmlManager.registerHotkeys(hotkeys[PanelNames.Html].reload, function() {this.reload_cur_iframe();});
    HtmlManager.registerHotkeys(hotkeys[PanelNames.Html].popout, function() {this.popout_cur_iframe();});
    GraphManager.registerHotkeys(hotkeys[PanelNames.Graph].save, function() {this.save_current_fig();});
    GraphManager.registerHotkeys(hotkeys[PanelNames.Graph].share, function() {this.share_current_fig();});
    GraphManager.registerHotkeys(hotkeys[PanelNames.Graph].reset, function() {this.reset_current_fig();});
  }

  var hotkeys;
  var keySettings;

  if (localStorage && localStorage.keySettings) {
    try {
      keySettings = JSON.parse(localStorage.keySettings);
    } catch (e) {
      keySettings = defaultKeySettings;
    }
  } else {
    keySettings = defaultKeySettings;
  }
  GlobalHotkeyManager.keySettings = keySettings;

  if (localStorage && localStorage.hotkeys) {
    try {
      // Use the default for ordering
      hotkeys = getDefaultHotkeys();
      var hotkeysConfig = JSON.parse(localStorage.hotkeys);

      // Configuration lives one level deep
      _.each(hotkeys, function(config, key, hotkeys) {
        _.extend(hotkeys[key], hotkeysConfig[key]);
      });
    } catch (e) {
      hotkeys = getDefaultHotkeys();
    }
  } else {
    hotkeys = getDefaultHotkeys();
  }

  try {
    registerAllHotkeys();
  } catch(e) {
    hotkeys = getDefaultHotkeys();
    registerAllHotkeys();
  }

  // actual handling of hotkeys

  $(document).keydown(function(ev) {
    if (GlobalHotkeyManager.handleEvent(ev)) {
      ev.preventDefault();
      return false;
    }

    for (var name  in Managers) {
      var manager = Managers[name];
      if (manager.focused()) {
        if ( manager.handleEvent(ev)) {
          ev.preventDefault();
          return false;
        }
      }
    }
  });

  // hotkeys modal

  $('#edit_hotkeys').click(function() {
    hotkeysHandler(hotkeys, getDefaultHotkeys(), keySettings, defaultKeySettings, function(newHotkeys, newKeySettings) {
      try {
        hotkeys = newHotkeys;
        registerAllHotkeys();
        hide_main_modal();
        for (var name in Managers) {
          var fn = Managers[name].update_toolbar_buttons;
          if (fn) {fn();}
        }
      } catch(e) {
        console.err(e);
        $('.hotkeys_message').text('Couldn\'t finish parsing hotkeys config: ' + e);
      }

      if (newKeySettings) {
        GlobalHotkeyManager.keySettings = newKeySettings;
        if (localStorage) {
          localStorage.keySettings = JSON.stringify(newKeySettings);
        }
        // TODO: Move this to terminal configuration when the UX changes
        if (window.Terminal) { Terminal.pasteMode = +newKeySettings.pasteMode; }
      }
    });
  });

})();

