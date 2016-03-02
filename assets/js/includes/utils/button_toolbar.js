/////////////////////////////////////////////////////////
// BUTTON TOOLBAR
/////////////////////////////////////////////////////////

function make_button(button, width) {

  var icon = button.icon || '';
  var text = button.text || '';
  var classes = button.classes || '';
  var extra_attrs = button.attrs || {};

  var button_div = $('<li>').addClass(classes)
    .append(
      $('<a>').append(
        $('<i>').addClass(icon),
        (button.withText ? (' ' + button.text) : '')
      )
    )
    .attr(extra_attrs);

  if (width) {
    button_div.css('width', width);
  }

  if (text) {
    if (button.hotkey) {
      var hotkeys = Managers[button.hotkey[0]].hotkey_mapping[button.hotkey[1]];
      if (hotkeys) {
        if (typeof hotkeys === 'string') {
          hotkeys = [hotkeys];
        }
        text += '<br/><span class="tooltip-subtitle">' + hotkeys.join(', ') + '</span>';
      }
    }
    button_div.tooltip({
      animation: true,
      html: true,
      placement: 'bottom',
      title: text,
    });
  }

  if (button.withSeparator) {
    button_div.addClass('with-separator');
  }

  if (button.click) {
    button_div.click(button.click);
  }
  return button_div;
}

function update_buttons(toolbar, buttons, button_width) {
  toolbar.empty();
  for (var i = 0; i < buttons.length; i++) {
    make_button(buttons[i], button_width).appendTo(toolbar);
  }
}
