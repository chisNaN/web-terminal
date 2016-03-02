/* globals utils */

function HotkeyManager() {
  this.hotkeys = {};

  this.specialKeys = {
          8: 'backspace',
          9: 'tab',
          10: 'return',
          13: 'return',
          19: 'pause',
          20: 'capslock',
          27: 'esc',
          32: 'space',
          33: 'pageup',
          34: 'pagedown',
          35: 'end',
          36: 'home',
          37: 'left',
          38: 'up',
          39: 'right',
          40: 'down',
          45: 'insert',
          46: 'del',
          96: '0',
          97: '1',
          98: '2',
          99: '3',
          100: '4',
          101: '5',
          102: '6',
          103: '7',
          104: '8',
          105: '9',
          106: '*',
          107: '+',
          109: '-',
          110: '.',
          111: '/',
          112: 'f1',
          113: 'f2',
          114: 'f3',
          115: 'f4',
          116: 'f5',
          117: 'f6',
          118: 'f7',
          119: 'f8',
          120: 'f9',
          121: 'f10',
          122: 'f11',
          123: 'f12',
          144: 'numlock',
          145: 'scroll',
          186: ';',
          187: '=',
          188: ',',
          189: '-',
          190: '.',
          191: '/',
          192: '`',
          219: '[',
          220: '\\',
          221: ']',
          222: '\'',
        };

  this.shiftNums = {
          '`': '~',
          '1': '!',
          '2': '@',
          '3': '#',
          '4': '$',
          '5': '%',
          '6': '^',
          '7': '&',
          '8': '*',
          '9': '(',
          '0': ')',
          '-': '_',
          '=': '+',
          ';': ':',
          '\'': '"',
          ',': '<',
          '.': '>',
          '/': '?',
          '\\': '|',
  };
}

HotkeyManager.prototype.eventHash = function(ev) {
  var hash = '';

  if (ev.altKey) { hash += 'alt+'; }
  if (ev.metaKey && utils.is_mac) { hash += 'cmd+'; }
  if (ev.ctrlKey) { hash += 'ctrl+'; }
  if (ev.shiftKey) { hash += 'shift+'; }
  hash += (this.specialKeys[ev.which] || String.fromCharCode(ev.which));

  return hash;
};

HotkeyManager.prototype.registerHotkeys = function(hotkeys, fn, proxy) {
  if (!proxy) { proxy = this; }
  if (typeof hotkeys === 'undefined') { hotkeys = []; }
  if (typeof hotkeys === 'string') { hotkeys = [hotkeys]; }
  for (var i = 0; i < hotkeys.length; i++) {
    var hotkey = hotkeys[i];

    // re-sort and fix case
    var parts = hotkey.split('+');
    var mapping = {
      'alt': 'alt',
      'control': 'ctrl',
      'ctrl': 'ctrl',
      'cmd': 'cmd',
      'command': 'cmd',
      'shift': 'shift',
    };

    var ev = {};
    for (var j = 0; j < parts.length - 1; j++) {
      var part = parts[j].trim().toLowerCase();
      if (mapping[part]) { ev[mapping[part]] = true; }
    }

    hotkey = '';
    if (ev.alt) { hotkey += 'alt+'; }
    if (ev.cmd) { hotkey += 'cmd+'; }
    if (ev.ctrl) { hotkey += 'ctrl+'; }
    if (ev.shift) { hotkey += 'shift+'; }
    var key = parts[parts.length - 1].trim();
    if (key.length === 1) { key = key.toUpperCase(); }
    hotkey += key;

    this.registerHotkey(hotkey, fn, proxy);
  }
};

HotkeyManager.prototype.registerHotkey = function(hotkey, fn, proxy) {
  if (!proxy) { proxy = this; }
  this.hotkeys[hotkey] = $.proxy(fn, proxy);
};

HotkeyManager.prototype.registerHotkeyByEvent = function(ev, fn, proxy) {
  if (!proxy) { proxy = this; }
  this.registerHotkey(this.eventHash(ev), fn, proxy);
};

HotkeyManager.prototype.unregisterAll = function() {
  this.hotkeys = {};
};

HotkeyManager.prototype.handleEvent = function(ev) {
  var fn = this.hotkeys[this.eventHash(ev)];
  if (fn) {
    fn();
    // TODO: make this an option when registering
    this.cancel(ev);
    return true;
  }
  return false;
};

HotkeyManager.prototype.cancel = function(ev) {
  if (ev.preventDefault) {
    ev.preventDefault();
  }
  ev.returnValue = false;
  if (ev.stopPropagation) {
    ev.stopPropagation();
  }
  ev.cancelBubble = true;
  return false;
};
