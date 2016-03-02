/* jshint -W117 */

function input_modal(pane, text, placeholder, callback, validate) {
  if (!pane) {pane = $('body');}

  var modal = $('#input_modal');
  modal.modal({'backdrop':'static'});
  position_modal_in_pane(modal, pane);
  $('.modal-body p', modal).text(text);
  $('#input_modal_input').attr('placeholder', placeholder);

  $('#input_modal_form').unbind('submit');
  $('#input_modal_form').submit(function(ev) {
    ev.preventDefault();
    $('#input_modal').modal('hide');
    var arg;
    if (validate) {
      arg = validate($('#input_modal_input').val());
    } else {
      arg = $('#input_modal_input').val();
    }
    callback(arg);

    return false;
  });

  modal.modal('show');
}

function confirm_modal(pane, text, callback, proxy) {
  if (!proxy) {
    proxy = $(this);
  }
  if (!pane) {
    pane = $('body');
  }

  var modal = $('#confirm_modal');
  modal.modal({'backdrop':'static', 'keyboard':false});
  position_modal_in_pane(modal, pane);
  $('.modal-body p', modal).text(text);

  $('#confirm_modal #confirm_no').unbind('click');
  $('#confirm_modal #confirm_no').click(function() {
    $.proxy(callback, proxy)(false);
  });

  $('#confirm_modal #confirm_yes').unbind('click');
  $('#confirm_modal #confirm_yes').click(function() {
    $.proxy(callback, proxy)(true);
  });
  $('#confirm_modal #confirm_yes').focus();

  modal.modal('show');
}

function position_modal_in_pane(modal, pane) {
  // TODO: figure out how to do this properly
  return;
  // REMEMBER TO USE AFTER RETRIEVING CONTENT!

  if (!pane) {// jshint ignore: line
    pane = $('body');
  }

  var pos = pane.offset();
  var h = pane.height();
  var w = pane.width();
  var modal_h = modal.height();
  var modal_w = modal.width();
  var top_margin = pos.top + (h / 2);
  var left_margin = pos.left + (w / 2);

  top_margin = Math.max(top_margin, 0);
  left_margin = Math.max(left_margin, 0);
  //top_margin = Math.min(top_margin, pos.top - modal_h)
  //left_margin = Math.min(left_margin, pos.left - modal_w)

  //modal.css('margin-left', 0 + 'px'); // Half of modal width, i think?
  // Bootstrap being dumb.  Careful when changing this.
  modal.css('margin-top', - (modal_h / 2) + 'px');
  modal.css('top', top_margin + 'px');
  modal.css('left', left_margin + 'px');
}

// TODO:  ID BEFORE PANE
function show_loading_modal(pane, id) {
  if (! (pane && pane.is(':visible'))) {pane = $('body');}

  if (!id) {id = get_random_string(32);}
  var modal = $('#loading_modal').clone(true)
                                 .attr('id', 'loading_modal_' + id)
                                 .addClass('loading_modal')
                                 .appendTo(pane);

  //modal.modal({'keyboard':false});
  //modal.modal({'backdrop':'static', 'keyboard':false});
  //position_modal_in_pane(modal, pane);
  //modal.modal('show');
  return id;
}

function hide_loading_modal(id) {
  logEvent({type:'hide_loading_modal', id:id});
  id = 'loading_modal_' + id;
  //$('#' + id).modal('hide');
  $('#' + id).remove();
}

function show_text_modal(text, pane, id) {
  if (! (pane && pane.is(':visible'))) {pane = $('body');}

  if (!id) {id = get_random_string(32);}
  var modal;
  if ($('#' + 'text_modal_' + id).length > 0) {
    modal = $('#' + 'text_modal_' + id);
    $('.modal-body', modal).empty();
  } else {
    modal = $('#text_modal').clone(true)
                            .attr('id', 'text_modal_' + id)
                            .addClass('text_modal')
                            .appendTo($('body'));
  }

  modal.modal({'keyboard':false});
  //modal.modal({'backdrop':'static', 'keyboard':false});
  position_modal_in_pane(modal, pane);
  modal.modal('show');
  $('.modal-body', modal).append(text_box(text));
  return id;
}

function hide_text_modal(id) {
  logEvent({type:'hide_text_modal', id:id});
  id = 'text_modal_' + id;
  $('#' + id).modal('hide');
  $('#' + id).remove();
}


function show_main_modal(div, useStaticBackdrop) {

  $('#main_modal .modal-body').empty();

  var modal = $('#main_modal');
  modal.modal({
    'keyboard': true,
    'backdrop': (useStaticBackdrop ? 'static' : true)
  });
  $('#main_modal .modal-body').append(div);
  modal.modal('show');
}

function hide_main_modal() {
  $('#main_modal').modal('hide');
  // THE FOLLOWING CAN HAPPEN IF SHOW MODAL HAPPENS MULTIPLE TIMES
  //http://stackoverflow.com/questions/11519660/twitter-bootstrap-modal-backdrop-doesnt-disappear
  $('body').removeClass('modal-open');
  $('.modal-backdrop').remove();
}

function show_image_modal(url) {
  // hack to get proper width and height
  var image = $('<img src="' + url + '"></img>');
  $('body').append(image);
  var height = image[0].clientWidth; // or image.width()
  var width = image[0].clientHeight; // or image.height()
  image.remove();

  console.log('width ', width);
  console.log('height',  height);
  if (height + width === 0) {
    console.log('For some reason, dimensions are 0');
    height = 100; width = 100;
  } else if (width === 0) {
    console.log('For some reason, width is 0');
    width = height;
  } else if (height === 0) {
    console.log('For some reason, height is 0');
    height = width;
  }

  // width and height can vary between 200-500, but less than the body - 100
  var max_height = Math.max(200, Math.min($('body').height() - 100, 500));
  var max_width  = Math.max(200, Math.min($('body').width()  - 100, 500));

  // scale down
  if (height > max_height) {
    width = width * (max_height / height);
    height = max_height;
  }
  if (width > max_width) {
    height = height * (max_width / width);
    width = max_width;
  }
  console.log('width ', width);
  console.log('height',  height);

  //var image = $('<img src="' + url + '" width="' + width + '" height="' + height + '"></img>');
  image = $('<img src="' + url + '" width="100%" height="100%"></img>');

  // image can sometimes be too big for screen...
  $('#main_modal .modal-body').empty();
  $('#main_modal .modal-body').append(image);

  var pop_out_button = $('<button>Pop out</button>');
  $('#main_modal .modal-body').append(pop_out_button);

  image.load(function() {
    console.log('loaded');
    console.log(image);

    var modal = $('#main_modal');
    var padding = parseInt($('#main_modal .modal-body').css('padding'));
    //modal.height(height + padding * 2);
    //modal.width(width + padding * 2);
    modal.height(300);
    modal.width(300);
    //modal.width(width);
    modal.modal({'keyboard':true});
    modal.modal('show');

    pop_out_button.click(function() {
      modal.modal('hide');
      window.open(url);
    });
  });
}

function trigger_files_modal(pane, options, crumbs, fileviewer, callback) {
  if (!pane) {
    pane = $('body');
  }

  var modal = $('#files_modal');
  modal.modal({'backdrop':'static'});

  $('#files_modal_submit').val(options.action);

  fileviewer.crumbs = crumbs;
  fileviewer.cd_callback(crumbs);
  position_modal_in_pane(modal, pane);

  if (options.input_default !== undefined) {
    $('#files_modal_input').val(options.input_default);
  }
  if (options.focus_name_input) {
    $('#files_modal_input').focus();
  }

  $('#files_modal_form').unbind('submit');
  $('#files_modal_form').submit(function(ev) {
    ev.preventDefault();
    $('#files_modal').modal('hide');
    callback(fileviewer.crumbs, $('#files_modal_input').val());
    return false;
  });

  modal.modal('show');
}

function readonly_box(text) {
  var box = $('<div type="text" id="text_shown" readonly="readonly"></div>');
  box.text(text);
  return box;
}

function text_box(text) {
  var box = $('<div id="text_shown" style="width:auto;"></div>');
  box.text(text);
  return box;
}

var errors_list = [];

function show_error(e) {
  var text = 'Error:\n\n' + e + '\n' + JSON.stringify(e.stack);
  show_main_modal(text_box(text));
  errors_list.push('client error: ' + JSON.stringify(e));

  //$.post(server_url + '/report_bug', {description: 'WINDOW.ONERROR:\n' + e + '\n' + JSON.stringify(e.stack)},
  //    function() {console.log('Reported error: \n' + e + '\n' + JSON.stringify(e.stack));}
  //);
}

//window.onerror = show_error;

$(document).ready(function() {
  $('#files_modal').on('shown', function () {
    $('#files_modal_input').focus();
  });

  $('#input_modal').on('shown', function () {
    $('#input_modal_input').focus();
  });

  $('#confirm_modal').on('shown', function () {
    $('#confirm_no').focus();
  });
});

