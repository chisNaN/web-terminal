/* eslint-disable camelcase, no-unused-vars */
/* globals HotkeyManager, Layout */

var Managers = {};

function PanelManager(name, panel) {
  panel = $(panel);

  panel.addClass('panel');

  this.panel = panel;
  this.panel_id = panel.attr('id');
  this.name = name;
  this.hotkey_mapping = {}; // for tooltips
  if (Managers[name]) {
    /* eslint-disable no-console */
    console.error('Panel is already registered with name ' + name);
    /* eslint-enable no-console */
  } else {
    Managers[name] = this;
  }

  var that = this;
  panel.click(function() { that.focus(); });

  this.hotkeys = new HotkeyManager();

  this.maximize_icon = $('<i>')
    .addClass('fa fa-fw fa-expand')
    .css('float', 'right')
    .click(function(ev) {
      ev.preventDefault();
      that.toggle_maximize();
      return false;
    });

  var dock = $('<li>')
    .addClass('panel_dock unselectable')
    .hide()
    .append(
       $('<a>').append($('<span>').text(name))
       .append(this.maximize_icon)
    )
    .appendTo($('#top_bar_views_list'))
    .click(function(ev) {
      ev.preventDefault();
      that.toggle();
      that.focus();
      return false;
    });

  this.dock = dock;

  this.showing = false;
  this.opened = false;
  this.maximized = false;
}

PanelManager.prototype.toggle = function() {
  // TODO: what about when it's hidden?
  if (this.showing) {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }
};

PanelManager.prototype.open = function() {
  for (var name in Managers) {
    Managers[name].minimize(true);
  }
  this.opened = true;
  this.panel.show();
  this.dock.addClass('active');
  Layout.open_pane(this.panel_id);
};

PanelManager.prototype.close = function(hiding) {
  if (!hiding) {
    for (var name in Managers) {
      Managers[name].minimize(true);
    }
  }
  this.opened = false;
  this.panel.hide();
  this.dock.removeClass('active');
  Layout.close_pane(this.panel_id);
};

PanelManager.prototype.show = function() {
  this.showing = true;
  this.dock.show();
};

// makes entire panel effectively not exist
PanelManager.prototype.hide = function() {
  this.showing = false;
  this.dock.hide();

  this.close(true); // rethink this?
};

PanelManager.prototype.maximize = function() {
  if (this.maximized) { return; }

  for (var name in Managers) {
    Managers[name].minimize();
    Managers[name].panel.hide();
    Managers[name].dock.addClass('suppressed');
  }
  this.panel.show();
  this.dock.removeClass('suppressed');
  this.dock.addClass('active');

  this.maximized = true;
  this.maximize_icon.removeClass('fa-expand').addClass('fa-compress');
  Layout.maximize(this.panel_id);
  Layout.render_configs();

  this.focus();
};

PanelManager.prototype.minimize = function(restore) {
  if (!this.maximized) { return; }

  this.panel.hide();
  if (restore) {
    for (var name in Managers) {
      if (Managers[name].opened) {
        Managers[name].panel.show();
      } else {
        Managers[name].dock.removeClass('active');
      }
      Managers[name].dock.removeClass('suppressed');
    }
  } else {
    this.dock.removeClass('active');
  }

  // check that I am maximized?
  this.maximized = false;
  this.maximize_icon.removeClass('fa-compress').addClass('fa-expand');
  Layout.minimize();
  Layout.render_configs();
};

PanelManager.prototype.toggle_maximize = function() {
  if (this.maximized) {
    this.minimize(true);
  } else {
    this.maximize();
  }
};

PanelManager.prototype.focused = function() {
  return this.panel.hasClass('active');
};

PanelManager.prototype.focus = function() {
  if (!this.showing) { return; }
  if (Layout.maximized) { this.maximize(); }
  // blur others
  for (var name in Managers) {
    if (name !== this.name) {
      Managers[name].blur();
    }
  }

  this.panel.addClass('active');
  if (this.focusContent) {
    this.focusContent();
  }
};

PanelManager.prototype.blur = function() {
  this.panel.removeClass('active');
  if (this.blurContent) {
    this.blurContent();
  }
};

PanelManager.prototype.visible = function() {
  return this.panel.is(':visible');
};

// TODO: do inheritance?
PanelManager.prototype.registerHotkey = function(hotkey, fn, proxy) {
  if (!proxy) { proxy = this; }
  this.hotkeys.registerHotkey(hotkey, fn, proxy);
};
PanelManager.prototype.registerHotkeys = function(hotkeys, fn, proxy) {
  if (!proxy) { proxy = this; }
  this.hotkeys.registerHotkeys(hotkeys, fn, proxy);
};
PanelManager.prototype.unregisterAll = function() {
  this.hotkeys.unregisterAll();
};

PanelManager.prototype.handleEvent = function(ev) {
  if (!this.focused()) { return this.log(this.name + ' was not focused'); }
  return this.hotkeys.handleEvent(ev);
};

PanelManager.prototype.log = function() {
  /* eslint-disable no-console */
  console.log.apply(console, arguments);
  /* eslint-enable no-console */
};


/* INITIALIZE MANAGERS*/
var PanelNames = {
  Files: 'Files',
  Editor: 'Editor',
  Graph: 'Graph',
  Terminal: 'Terminal',
  Html: 'Browser',
  Chat: 'Chat',
};

var GlobalHotkeyManager = new HotkeyManager();
var FilesManager = new PanelManager(PanelNames.Files, $('#files_container'), {});
var EditorManager = new PanelManager(PanelNames.Editor, $('#editor_container'), {});
var GraphManager = new PanelManager(PanelNames.Graph, $('#plot_window'), {});
var TerminalManager = new PanelManager(PanelNames.Terminal, $('#shell_container'), {});
var HtmlManager = new PanelManager(PanelNames.Html, $('#html_container'), {});
var ChatManager = new PanelManager(PanelNames.Chat, $('#chat_container'), {});
