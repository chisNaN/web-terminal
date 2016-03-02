/* jshint -W117 */

(function(exports) {

$(document).ready(function() {
  exports.show();

  //$('#editor_container').show();
  ace.config.set('basePath', '/lib/ace');

  var editor = ace.edit('editor');

  exports.cur_file = null; // full name of current file
  exports.cur_files = {}; // full names  -> link
  editor.setOptions({enableBasicAutocompletion: true});

  exports.cur_files_saved = {};


  var socket = get_socket('editor');

  //var editor= ace.edit('editor');
  exports.editor = editor;

  editor.setHighlightActiveLine(false);
  editor.setKeyboardHandler(null);

  $('#editor').hide();
  $('#spreadsheet').hide();

  function getContents(link) {
    if (link.data('type') == 'text') {
      return link.data('session').getValue();
    } else {
      return link.data('contents');
    }
  }

  function supports_local_storage() {
    try {
      return 'localStorage' in window && window.localStorage !== null;
    } catch(e){
      return false;
    }
  }

  function storeLocal() {
    if (supports_local_storage()) {
      var obj = {};
      for (var name in exports.cur_files) {
        var contents = getContents(exports.cur_files[name]);
        obj[name] = contents;
      }
      localStorage.editor = JSON.stringify(obj);
    }
    //console.log(JSON.parse(localStorage.editor))
  }

  function getLocalContents(full_name) {
    //console.log('GETTING LOCAL CONTENTS', full_name)
    var contents;
    if (supports_local_storage()) {
      return JSON.parse(localStorage.editor)[full_name];
    }
    return contents;
  }

  window.onbeforeunload = function(e) {
    var unsaved = false;
    for (var name in exports.cur_files_saved ) {
      // TODO: what about '!'?
      if (exports.cur_files_saved[name]  == '*') {
        unsaved = true;
        break;
      }
    }
    if (unsaved) {
      return 'You have unsaved changes in at least one file. ' +
        'Are you sure you want to navigate away?';
    }
  };

  function saveCurrent() {
    // TODO: should we support a way that doesn't require an active socket.io?
    // post request to save it
    var link = getTabLink();
    if (!link) { return; }

    var full_name = link.data('name');
    var contents = getContents(link);

    function save() {
      socket.emit('message', {
        from: 'editor',
        to: 'computer',
        type: 'put',
        passback: '0',
        path: full_name,
        is_dir: false,
        value: contents,
        encoding: 'utf8'
      });

      // no longer able to undo
      //editor.getSession().getUndoManager().reset()
    }

    if ($('.editor_tab_save', link).html() == '!') {
      var confirm_msg = 'File has been modified since you opened. Continue save?';
      confirm_modal($('body'), confirm_msg, function(bool) {
        if (bool) { save(); }
      });
    } else {
      save();
    }
  }
  exports.saveCurrent = saveCurrent;

  function renameCurrentTab(full_name) {
    // TODO: this probably doesnt work
    var link = getTabLink();
    var name = get_name(full_name);

    exports.cur_files[full_name] = link;
    link.data('name', full_name);
    link.attr('title', full_name);
    $('.editor_tab_text', link).text(name);
  }

//  // HOTKEYS
//  commands.addCommand({
//    name: 'save',
//    bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
//    exec: saveCurrent
//  });
////  commands.addCommand({
////    name: 'reload',
////    bindKey: {win: 'Ctrl-R', mac: 'Command-R'},
////    exec: reloadCurrent
////  });
//    commands.addCommand({
//      name: 'run',
//      bindKey: {win: 'Ctrl-R', mac: 'Command-R'},
//      exec: runCurrent
//    });
//    // TODO: why does this not work?
//    commands.addCommand({
//      name: 'new',
//      bindKey: {win: 'Ctrl-E', mac: 'Command-E'},
//      exec: newFile
//    });



  // from http://ace.c9.io/build/kitchen-sink/demo.js
  var supportedModes = {
      ABAP:        ['abap'],
      ADA:         ['ada|adb'],
      ActionScript:['as'],
      AsciiDoc:    ['asciidoc'],
      Assembly_x86:['asm'],
      AutoHotKey:  ['ahk'],
      BatchFile:   ['bat|cmd'],
      C9Search:    ['c9search_results'],
      C_Cpp:       ['c|cc|cpp|cxx|h|hh|hpp'],
      Clojure:     ['clj'],
      Cobol:       ['^CBL|COB'],
      coffee:      ['^Cakefile|coffee|cf|cson'],
      ColdFusion:  ['cfm'],
      CSharp:      ['cs'],
      CSS:         ['css'],
      Curly:       ['curly'],
      D:           ['d|di'],
      Dart:        ['dart'],
      Diff:        ['diff|patch'],
      Dot:         ['dot'],
      Erlang:      ['erl|hrl'],
      EJS:         ['ejs'],
      Forth:       ['frt|fs|ldr'],
      FTL:         ['ftl'],
      Glsl:        ['glsl|frag|vert'],
      golang:      ['go'],
      Groovy:      ['groovy'],
      HAML:        ['haml'],
      Haskell:     ['hs'],
      haXe:        ['hx'],
      HTML:        ['htm|html|xhtml'],
      HTML_Ruby:   ['erb|rhtml|html.erb'],
      Ini:         ['Ini|conf'],
      Jade:        ['jade'],
      Java:        ['java'],
      JavaScript:  ['js'],
      JSON:        ['json'],
      JSONiq:      ['jq'],
      JSP:         ['jsp'],
      JSX:         ['jsx'],
      Julia:       ['jl'],
      LaTeX:       ['latex|tex|ltx|bib'],
      LESS:        ['less'],
      Liquid:      ['liquid'],
      Lisp:        ['lisp'],
      LiveScript:  ['ls'],
      LogiQL:      ['logic|lql'],
      LSL:         ['lsl'],
      Lua:         ['lua'],
      LuaPage:     ['lp'],
      Lucene:      ['lucene'],
      Makefile:    ['^GNUmakefile|^makefile|^Makefile|^OCamlMakefile|make'],
      MATLAB:      ['m|matlab'],
      //MATLAB:      ['matlab'],
      Markdown:    ['md|markdown'],
      MySQL:       ['mysql'],
      MUSHCode:    ['mc|mush'],
      ObjectiveC:  ['mm'],
      //ObjectiveC:  ['m|mm'],
      OCaml:       ['ml|mli'],
      Pascal:      ['pas|p'],
      Perl:        ['pl|pm'],
      pgSQL:       ['pgsql'],
      PHP:         ['php|phtml'],
      Powershell:  ['ps1'],
      Prolog:      ['plg|prolog'],
      Properties:  ['properties'],
      Python:      ['py'],
      R:           ['r'],
      RDoc:        ['Rd'],
      RHTML:       ['Rhtml'],
      Ruby:        ['ru|gemspec|rake|rb'],
      Rust:        ['rs'],
      SASS:        ['sass'],
      SCAD:        ['scad'],
      Scala:       ['scala'],
      Scheme:      ['scm|rkt'],
      SCSS:        ['scss'],
      SH:          ['sh|bash'],
      snippets:    ['snippets'],
      SQL:         ['sql'],
      Stylus:      ['styl|stylus'],
      SVG:         ['svg'],
      Tcl:         ['tcl'],
      Tex:         ['tex'],
      Text:        ['txt'],
      Textile:     ['textile'],
      Toml:        ['toml'],
      Twig:        ['twig'],
      Typescript:  ['typescript|ts|str'],
      VBScript:    ['vbs'],
      Velocity:    ['vm'],
      XML:         ['xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl'],
      XQuery:      ['xq'],
      YAML:        ['yaml']
  };


  window.define = ace.define; // todo: get rid of this?

  var ext_to_mode_map = {
  };

  for (var modename in supportedModes) {
    var ext_list = supportedModes[modename][0].split('|');
    modename = modename.toLowerCase();
    for (var i = 0;  i < ext_list.length; i++) {
      ext_to_mode_map[ext_list[i]] = modename;
    }
  }

  var ace_themes = {
    light: {
      themes: [
      'chrome',
      'clouds',
      'crimson_editor',
      'dawn',
      'dreamweaver',
      'eclipse',
      'github',
      'solarized_light',
      'textmate',
      'tomorrow',
      'xcode',
      ]
      },
    dark: {
      themes: [
        'ambiance',
        'chaos',
        'clouds_midnight',
        'cobalt',
        'idle_fingers',
        //'kr', // wtf, this one doesnt work
        'merbivore',
        'merbivore_soft',
        'mono_industrial',
        'monokai',
        'pastel_on_dark',
        'solarized_dark',
        'terminal',
        'tomorrow_night_blue',
        'tomorrow_night_bright',
        'tomorrow_night_eighties',
        'tomorrow_night',
        'twilight',
        'vibrant_ink',
        ]
      },
  };

  var theme_mapping = {};
  var default_theme = 'textmate';

  function choose_theme(theme) {
    if (!theme || !theme_mapping[theme]) {
      theme = default_theme;
    }

    $('.theme_dropdown').removeClass('active_theme_dropdown');
    theme_mapping[theme].dropdown.addClass('active_theme_dropdown');
    editor.setTheme('ace/theme/' + theme);
    localStorage.ace_theme = theme;

    var metatheme = theme_mapping[theme].metatheme;
    $('.metathemes_button').hide();
    $('.metathemes_button.metatheme_' + metatheme).show();
    $('body').removeClass();
    $('body').addClass('theme_' + metatheme);
  }

  function setup_theme(metatheme, theme) {
    var theme_words = theme.split('_');
    var theme_name = [];
    for (var i = 0; i < theme_words.length; i++) {
      theme_name.push(theme_words[i].charAt(0).toUpperCase() + theme_words[i].slice(1));
    }
    var link = $('<a>').addClass('theme_dropdown').text(theme_name.join(' '))
      .attr({'role': 'button', 'data-toggle': 'modal'})
      .hover(function() { choose_theme(theme); })
      .click(function() { choose_theme(theme); });
    $('<li>').append(link).appendTo(metatheme_dropdown);
    theme_mapping[theme] = {
      dropdown: link,
      metatheme: metatheme
    };
  }

  function hideTooltip() {
    $(this).tooltip('hide');
  }
  for (var metatheme in ace_themes) {
    var metatheme_dropdown =
      $('<ul>').addClass('dropdown-menu');
    var metatheme_item =
      $('<a>').addClass('dropdown-toggle')
      .attr('data-toggle','dropdown')
      .html('<i class="fa fa-fw fa-adjust"></i>');
    var metatheme_menu =
      $('<li>').addClass('metathemes_button')
      .addClass('metatheme_' + metatheme)
      .append(metatheme_item)
      .append(metatheme_dropdown)
      .click(hideTooltip);
    $('#editor_toolbar').append(metatheme_menu);

    var themes = ace_themes[metatheme].themes;
    for (var k = 0; k < themes.length; k++) {
      var theme = themes[k];
      setup_theme(metatheme, theme);
    }
  }

  bind_dropdown_submenus();

  $('.metathemes_button').tooltip({
    animation: true,
    html: true,
    placement: 'bottom',
    title: 'Theme'
  });
  $('.metathemes_button .dropdown-menu').hover(function(e) {
    e.preventDefault();
    e.stopPropagation();
  });

  choose_theme(localStorage.ace_theme);

  // TODO: save a light and dark theme in localStorage and switch between them,
  // rather than switching to default light and dark themes
  $('#toggle_metatheme').click(function(ev) {
    var theme = localStorage.ace_theme;
    var metatheme = theme && theme_mapping[theme] && theme_mapping[theme].metatheme;
    if (metatheme === 'light') {
      choose_theme('terminal');
    } else {
      choose_theme('textmate');
    }
    return false;
  });

  function SetSessionDefaults(session, extension) {
    session.setUndoManager(new ace.UndoManager());

    var modename = 'ace/mode/' + (ext_to_mode_map[extension] || 'text');
    session.setMode(modename);
    //get_mode(extension, function(Mode) {
    //  session.setMode(new Mode());
    //});

    session.setTabSize(2);
    session.setUseSoftTabs(true);
    //session.setUseWrapMode(false);
    session.setUseWrapMode(true);
    session.setWrapLimitRange(null, null);
    //session.setUseWrapMode(true);
    //session.setWrapLimitRange(80, 80);
    return session;
  }


  function close_tab(path, client_triggered) {
    if (client_triggered) {
      socket.emit('message', {
        from:'editor',
        to: 'computer',
        type:'close',
        passback:'0',
        path: path,
        client_id: client_id
      });
    }

    if (! (path in exports.cur_files)) {
      return console.log('Cannot close: ' + path + '.  File was not open!');
    }

    if (exports.cur_file == path) {
      // choose the next current file
      exports.cur_file = null;
      var breaknext = false;
      for (var full_name in exports.cur_files) {
        if (breaknext) {
          exports.cur_file = full_name;
          break;
        }
        if (full_name == path) {
          breaknext = true;
        } else {
          exports.cur_file = full_name;
        }
      }
    }

    exports.cur_files[path].parent().remove();
    delete exports.cur_files[path];
    delete exports.cur_files_saved[path];

    set_editor_tabs_width();

    if (exports.cur_file === null) {
      $('#editor').hide();
    } else {
      exports.cur_files[exports.cur_file].click();
    }
    storeLocal();
  }

  exports.CloseCurTab = function() {
    var activeTabs = $('#editor_tabs .tab.active');
    if (!activeTabs.length) {
      return;
    }
    if (activeTabs.length > 1) {
      console.log('weird, more than one active tab', activeTabs);
    }

    var curTab = activeTabs[0];
    $('.closetab', curTab).click();
  };

  function runCommand(cmd) {
    //console.log('run command');
    TerminalManager.curTerm().handler(cmd + '\n');
    //document.shell_iframe.tty.window.focused.handler(cmd+'\n');
  }

  function runCurrent() {
    if (!exports.cur_file) { return; }

    // make a special octave command for this...
    var extension = get_extension(exports.cur_file);
    if (extension == 'm') {
      // TODO: switch back to ~ or something?
      runCommand('run(\'' + exports.cur_file + '\');');
      //socket.emit('message', {from:'editor', to: 'computer', type:'runfile', passback:'0',  path: exports.cur_file });
    } else if (extension == 'sh') {
      runCommand('bash ' + exports.cur_file);
    } else if ((extension == 'c') || (extension == 'cpp') || (extension == 'cc')) {
      // get_name(exports.cur_file).substr(-2)
      runCommand('make');
    } else if (extension == 'clog' || extension == 'cmacro') {
      socket.emit('message', {from:'editor', to: 'computer', type:'playback_speed', passback:'0', speed: 1 });

      socket.emit('message', {from:'editor', to: 'computer', type:'playback', passback:'0',  path: exports.cur_file });

      $('#meta_toolbar').css('width', '50%');
      $('#playback_bar').css('width', '50%');

      $('#playback_bar').show();
      var speed_slider = $('#playback_slider').slider({min: 0, max: 10, value: 1});

      speed_slider.on('slide', function(ev) {
        var val = speed_slider.data('slider').getValue();
        socket.emit('message', {from:'editor', to: 'computer', type:'playback_speed', passback:'0', speed: val });
      });
      speed_slider.slider('setValue', 1);

      $('#playback_progress').css('width', '80%');
      $('#playback_progress .bar').css('width', '0%');
      $('#playback_slider').css('width', '20%');
      open_meta_pane();

    } else {
      show_main_modal(text_box('Sorry! Don\'t know how to run this file.'));
    }
  }
  exports.runCurrent = runCurrent;

  function reloadCurrent() {
    if (!exports.cur_file) { return; }
    exports.open_file(exports.cur_file, {force: true, reload: true});
  }
  exports.reloadCurrent = reloadCurrent;

  function newFile() {
    trigger_files_modal(
      $('body'), {action: 'Open File', input_default: ''} ,
      FilesManager.cur_dir.slice(0),
      modal_file_viewer,
      function(crumbs, name) {
        var path = ensure_valid_location(crumbs.join('/') + '/' + name);
        var id = show_loading_modal($('#editor_container'));
        exports.open_file(path, {force: true, reload: false, loading_id: id});
      });
  }
  exports.newFile = newFile;

  $('#editor_container .empty_newtab').click(newFile);

  var commands = editor.commands;

  if (localStorage && localStorage.editor_hotkeys) {
    saveEditorHotkeys(JSON.parse(localStorage.editor_hotkeys));
  }

  function showHotkeys() {
    var hotkeys = {
      'General': {},
    };
    for (var command in commands.commands) {
       var bindings;
       if (commands.commands[command].bindKey &&
           commands.commands[command].bindKey[commands.platform]) {
        bindings = commands.commands[command].bindKey[commands.platform]
          .replace(/Command/g, 'Cmd')
          .replace(/Option/g, 'Alt')
          .replace(/-/g,'+');
        hotkeys.General[command] = bindings.split('|');
      } else {
        hotkeys.General[command] = [''];
      }     
    }
    hotkeysHandler(hotkeys, null, null, null, saveEditorHotkeys);
  }

  function saveEditorHotkeys(hotkeys) {
    localStorage.editor_hotkeys = JSON.stringify(hotkeys);
    for (var command in hotkeys.General) {
      var newCommands = hotkeys.General[command]
        .join('|')
        .replace(/Cmd/g, 'Command')
        .replace(/Alt/g, 'Option')
        .replace(/\+/g,'-');
      var newCommand = $.extend({}, commands.commands[command]);
      var os = utils.is_mac ? 'mac' : 'win';
      newCommand.bindKey = newCommand.bindKey || {
        mac: '',
        win: '',
      };
      newCommand.bindKey[os] = newCommands;
      commands.addCommand(newCommand);
    }
    hide_main_modal();
  }

  var editor_buttons = [
    {
      icon: 'fa fa-fw fa-play',
      text: 'Run',
      click: runCurrent,
      hotkey: [exports.name, 'run']
    },
    {
      icon: 'fa fa-fw fa-save',
      text: 'Save',
      click: saveCurrent,
      hotkey: [exports.name, 'save']
    },
    {
      icon: 'fa fa-fw fa-refresh',
      text: 'Reload',
      click: reloadCurrent,
      hotkey: [exports.name, 'reload']
    },
    {
      icon: 'fa fa-fw fa-folder-open',
      text: 'Open',
      click: newFile,
      hotkey: [exports.name, 'newfile'],
      withSeparator: true
    },
    {
      icon: 'fa fa-fw fa-keyboard-o',
      text: 'Hotkeys',
      click: showHotkeys
    }
  ];

  function update_toolbar_buttons() {
    var $toolbar = $('#editor_toolbar');
    var button_width = 35;
    $toolbar.children().not('.metathemes_button').remove();
    for (var i = 0; i < editor_buttons.length; i++) {
      make_button(editor_buttons[i], button_width).appendTo($toolbar);
    }
  }

  update_toolbar_buttons();
  exports.update_toolbar_buttons = update_toolbar_buttons;

  function set_editor_tabs_width() {
    var pane_width = $('#editor_container').width();
    var editor_tabs = $('#editor_tabs .tab');
    var editor_texts = $('.editor_tab_text');

    var num_files = editor_tabs.length;

    // 10 for left padding, 10 for right padding,
    // 2 for left margin, 2 for right margin, 2 for space between?
    var tab_width = (pane_width - 10) / num_files;
    tab_width = Math.min(200, tab_width);

    editor_tabs.css('width', tab_width);
    editor_texts.css('width', tab_width - 35);
    // 25 is enough to prevent * and ! from screwing stuff up
  }

  function getTabLink(index) {
    if (index === undefined) { index = exports.cur_file; }
    return exports.cur_files[index];
  }

  function AddTab(full_name, contents, showtab, reload, hello) {
    $('#editor').show();
    // TODO: Add a spinner, which gets removed only after the session tab is shown

    // TODO: don't save changes that agree with server?
    //var local_contents = getLocalContents(full_name);
    //console.log('LOCAL CONTENTS', local_contents)
    //console.log(typeof local_contents)
    //console.log(local_contents !== undefined)

    //var localWorking = false;
    //if ((!reload) && (local_contents !== undefined) && (local_contents !== contents)) {
    //  console.log('SETTING LOCAL CONTENTS! for ', full_name)
    //  localWorking = true;
    //  contents = local_contents;
    //}

    var name = get_name(full_name);
    var extension = get_extension(name);
    var is_tabular = (extension in tabular_types);
    exports.cur_files_saved[full_name] = '';

    function show() {
      if (!hello) {
        // don't open if editor was explicitly hidden
        //if (!exports.showing) { exports.open(); }
        exports.open();
      }
      exports.show();
    }

    function empty_function() {}
    for (var k in exports.cur_files) {
      if (k == full_name) {
        exports.cur_file = k;
        var link = getTabLink();
        if (!link) { return; }
        if (showtab) {
          var parent = link.parent();
          (jQuery.hasData(parent[0]) && jQuery._data(parent[0]))
            .events.click[0].handler({'preventDefault': empty_function});
        }
        if (reload) {
          if (is_tabular) {
            if (extension == 'csv') {
              set_spreadsheet_data($('#spreadsheet'), get_csv_data(contents));
            }
          } else {
            link.data('session').setValue(contents);
          }
          socket.emit('message', {
            from: 'editor',
            to: 'computer',
            type: 'contents_check',
            path: full_name,
            client_id: client_id
          });
        }
        show();
        return;
      }
      if (get_name(k) == name) {
        // WAT?
        show_main_modal(text_box('Be careful!  You have multiple files open with the name: ' + name));
      }
    }

    show();

    var newLi = $('<div>').addClass('tab');
    var newLink = $('<span>').addClass('editor_tab');
    var text = $('<span>').addClass('editor_tab_text').text(name);
    newLink.append(text);

    //exports.cur_files_saved[full_name] = localWorking ? '*' : '';
    exports.cur_files_saved[full_name] = '';
    exports.cur_file = full_name;

    exports.cur_files[full_name] = newLink;
    //text.editable(function(new_name, settings) {
    //  $(this).text(new_name);

    //  var parts = full_name.split('/')
    //  parts[parts.length - 1] = new_name;
    //  var new_full_name = parts.join('/');

    //  renameCurrentTab(new_full_name);
    //  return new_name;
    //}, {
    //  height:$(this).height()+'px',
    //  width:$(this).width()+'px',
    //  onblur:'submit',
    //  event:'dblclick'
    //})
    newLink.attr('title', full_name);

    var save = $('<span>').addClass('editor_tab_save').text(exports.cur_files_saved[full_name]);
    newLink.append(save);

    newLink.data('index', full_name);

    function switch_to_tab(ev) {
      // send a socket event to sync?
      ev.preventDefault();
      exports.cur_file = full_name;
      // TODO: either sync, or store the old file in a cookie?
      // socket.emit('message', {
      //   from:'editor',
      //   to: 'computer',
      //   type:'open',
      //   path: exports.cur_files[exports.cur_file],
      //   reload: false
      // });
      $('#editor_tabs .tab').removeClass('active');
      newLi.addClass('active');
      $('#editor_tabs .tab').removeClass('activeright');
      newLi.next().addClass('activeright');
    }

    newLink.data('name', full_name);

    var newCloseLink = $('<span>').addClass('closetab').html('&times;');
    newCloseLink.data('index', full_name);
    newCloseLink.click(function(ev) {
      var index = $(this).data('index');
      var link = getTabLink(index);
      var path = link.data('name');
      if (exports.cur_files_saved[index] !== '') {
        confirm_modal($('#editor_container'),
                      'You have unsaved changes, which will be lost. Continue?',
                      function(bool) {
                        if (bool) { close_tab(path, true); }
                      });
      } else {
        close_tab(path, true);
      }
      return false;
    });
    newLink.append(newCloseLink);

    newLi.append(newLink);

    var on_change;
    if (is_tabular) {
      on_change = function(changes, source) {
        var link = getTabLink();
        if (!changes) { return; }
        if (exports.cur_files_saved[exports.cur_file] === '') {
          exports.cur_files_saved[exports.cur_file] = '*';
          $('.editor_tab_save', link).html('*');
        }
        var data = $('#spreadsheet').handsontable('getData');

        var row_contents = [];
        for (var k in data) {
          var row = data[k];
          row_contents.push(row.join(','));
        }
        var new_contents = row_contents.join('\n');
        link.data('contents', new_contents);
        storeLocal();
      };

      newLink.data('type', 'tabular');

      set_spreadsheet_data($('#spreadsheet'), get_csv_data(contents), on_change);
      newLi.data('contents', contents);
      newLi.click(function(ev) {
        switch_to_tab(ev);
        $('#spreadsheet').show();
        $('#editor').hide();
        var contents = $(this).data('contents');
        set_spreadsheet_data($('#spreadsheet'), get_csv_data(contents), on_change);
        return false;
      });
    } else {
      on_change = function() {

        if (exports.cur_files_saved[exports.cur_file] === '') {
          exports.cur_files_saved[exports.cur_file] = '*';
          $('.editor_tab_save', getTabLink()).html('*');
        //} else if (exports.cur_files_saved[exports.cur_file] == '*') {
        //  var has_undo = EditorManager.editor.getSession().getUndoManager().hasUndo();
        //  if (!has_undo) {
        //    exports.cur_files_saved[exports.cur_file] = '';
        //    $('.editor_tab_save', getTabLink()).html('');
        //  }
        }
        storeLocal();
      };

      newLink.data('type', 'text');

      //console.log('EDIT SESSION', contents);
      //try {
        var session = new ace.EditSession(contents);
        SetSessionDefaults(session, extension);
        newLink.data('session', session);
        editor.setSession(session);
        session.on('change', on_change);
        newLi.click(function(ev) {
          switch_to_tab(ev);
          $('#editor').show();
          $('#spreadsheet').hide();
          editor.setSession(session);
          return false;
        });

      //} catch (e) {
      //  show_main_modal(text_box('Sorry! Cannot open this file:' + e));
      //  close_tab(full_name, true);
      //}

    }
    newLi.click();

    $('#editor_tabs').append(newLi);

    set_editor_tabs_width();
    storeLocal();
  }

  exports.SwitchTab = function(diff) {
    return function() {
      var tabs = $('#editor_tabs .tab');
      var index = null;
      for (var i=0; i < tabs.length; i++) {
        if ($(tabs[i]).hasClass('active')) {
          index = i;
          break;
        }
      }
      if (index !== null) {
        var new_index = (index + diff + tabs.length) % tabs.length;
        var link = $('.editor_tab', tabs[new_index]);
        link.click();
      }
    };
  };
  exports.NextTab = exports.SwitchTab(1);
  exports.PrevTab = exports.SwitchTab(-1);


  socket.on('message', function(msg) {handle_message(msg);});

  exports.open_file = function(path, options) {
    // options:
    //    force,
    //    loading_id,
    var message = options;
    message.from = 'editor';
    message.to = 'computer';
    message.type = 'open';
    message.path = path;
    message.client_id = client_id;
    socket.emit('message', message);
  };

  function handle_message(msg) {
    if (msg.type == 'open') {
      if (msg.result.force_prompt) {
        if ((!msg.client_id) || (msg.client_id == client_id)) {
          if (msg.loading_id) { hide_loading_modal(msg.loading_id); }
          confirm_modal($('body'), msg.result.force_prompt, function(confirmed) {
            if (!confirmed) {
              socket.emit('message', {
                from:'editor',
                to: 'computer',
                type:'close',
                passback:'0',
                path: msg.path,
                client_id: client_id
              });
              return;
            }
            var id = show_loading_modal($('#editor_container'));
            exports.open_file(msg.path, {force: true, loading_id: id});
          });
        }
      } else if (msg.result.error) {
        show_error(msg.result.error);
      } else {
        if ((!msg.reload) || (!msg.client_id) || (msg.client_id == client_id) ) {
          if (typeof msg.result.contents !== 'string') {
            return console.log('Contents undefined! shouldnt happen');
          }
          AddTab(msg.path, msg.result.contents, (!msg.dont_show), msg.reload, msg.hello);
          hide_loading_modal(msg.loading_id);
        }
      }
    } else if (msg.type == 'close') {
      if (msg.client_id != client_id) {
        close_tab(msg.path, false);
      }
    } else if (msg.type == 'closeallnot') {
      for (var path in exports.cur_files) {
        if (! (path in msg.paths)) {
          close_tab(path, false);
        }
      }
    } else if (msg.type == 'contents_check') {
      if ((!msg.client_id) || (msg.client_id == client_id)) { // important b/c reload
        for (var full_name in exports.cur_files) {
          if (full_name == msg.path) {
            var link = getTabLink(full_name);
            var contents = getContents(link);
            var hash = CryptoJS.SHA3(contents).toString();
            //console.log('hashes', typeof msg.hash, typeof hash);
            //console.log('hashes', '[' + msg.hash + ']', '[' + hash + ']');
            //console.log('cur file', full_name);

            if (msg.hash == hash) { exports.cur_files_saved[full_name] = ''; }
            else { exports.cur_files_saved[full_name] = '!'; }

            $('.editor_tab_save', link).html(exports.cur_files_saved[full_name]);
            break;
          }
        }
      }
    } else if (msg.type == 'hello') {
      // DO nothing
    } else {
      console.log('UNHEARD MESSAGE');
      console.log(msg);
    }
  }


  $('#editor_tabs').empty();

  var editor_resize_wait_time = 100;
  var resize_editor = utils.exec_sparsely(function() {
        editor.resize();
        set_editor_tabs_width();
        update_toolbar_buttons();
  }, editor_resize_wait_time);

  $('#editor_container').resize(resize_editor);
  $(window).resize(resize_editor);
  resize_editor();

  exports.focusContent = function() {
    // TODO: tabular content?
    editor.focus();
  };
  exports.blurContent = function() {
    // TODO: tabular content?
    editor.blur();
  };

});

})(EditorManager);
