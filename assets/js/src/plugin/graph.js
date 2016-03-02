/* jshint -W117 */

(function(exports) {

$(document).ready(function() {

  var last_plot_id = -1;
  var socket;
  socket = get_socket('plot');

  var cur_figure = null; // current figure ID

  //var root_node = new GraphicsObjects.RootNode();

  var figure_plotter = {
    cache: {}, // TODO: axis plotters should use this global cache
    axis_plotters: {},
    figure_states: {}
  };
  exports.figure_plotter = figure_plotter;

  function reset_figure_plotter() {
    $('.figure_div').remove();
    for (var h in figure_plotter.axis_plotters) {
      figure_plotter.axis_plotters[h]._delete();
    }
    figure_plotter.axis_plotters = {};
    figure_plotter.figure_states = {};
  }

  // cache :
  //     md5 ->  { drawables: [drawables], json: json }
  // figure_states:
  //     figID -> {
  //                 axes : {
  //                       axis_handle ('n.m.p') -> axis state:
  //                          {div: div}
  //                        }
  //                 cur_plot: [n,m,p],
  //                 div: div for figure
  //               }
  // axis_plotters :
  //     handle -> axis_plotter
  //
  // message: (received from octave)
  //    {
  //      figures: [figure = { handle: handle,
  //                           axes: [{axes properties}]
  //                         }
  //               ],
  //      gcf: gcf
  //    }

  exports.open_if_new = function() {
    if (!exports.showing) { exports.open(); }
  };

  function redraw_figures(msg, hello) {
    if (!msg) {msg = figure_plotter.message;}
    if ((!msg) || (!msg.figures.length)) {return exports.hide();}
    var figures = msg.figures;

    reset_figure_plotter();
    figure_plotter.message = msg;
    for (var i in figures) {
      var figure_obj = figures[i];
      var figure_state = make_new_figure(figure_obj.handle);
      for (var k in figure_obj.axes) {
        var axis_obj = figure_obj.axes[k];
        //console.log('MODIFIED', axis_obj.handle, axis_obj.modified)
        add_subplot(figure_state, axis_obj);
      }
    }

    // NOTE: show/hide trigger resize, which then triggers redraw
    if (figures.length) {
      if (!hello) {
        exports.open_if_new();
      }
      exports.show();
      setFig(msg.gcf); // does the drawing itself
    } else {
      exports.hide();
    }

    update_figure_tabs();
  }

  function draw_figure_state(figure_state) {
    figure_state.drawn = true;
    for (var k in figure_state.axes) {
      var axis_state = figure_state.axes[k];
      var plot_div = $('.plot_div', axis_state.div);
      plot_div.css('width', '100%');
      plot_div.css('height', '100%');
      plot_div.empty();

      var options = axis_state.properties;
      var axis_plotter = new canvasAxisPlotter(socket, plot_div, figure_plotter.cache, options);
      axis_plotter.set_mode(cur_mode);
      figure_plotter.axis_plotters[options.handle] = axis_plotter;
    }
  }


  function add_subplot(figure_state, properties) {
    var main_div = figure_state.div;

    var placeholder = $('<div></div>');
    placeholder.css('position', 'absolute');

    var left   = properties.OuterPosition[0];
    var bottom = properties.OuterPosition[1];
    var width  = properties.OuterPosition[2];
    var height = properties.OuterPosition[3];

    var top    = 1 - bottom - height;

    placeholder.css('left', (left*100) + '%');
    placeholder.css('top',  (top*100)+ '%');
    placeholder.css('right',  'auto');
    placeholder.css('bottom', 'auto');
    placeholder.css('width', (width * 100) + '%');
    placeholder.css('height', (height * 100) + '%');

    var center = $('<center></center>');
    var title_div = $('<div class="title_div"></div>');
    title_div.css('text-align', 'center');
    placeholder.append(title_div);
    var plot_div = $('<div class="plot_div"></div>');
    plot_div.css('margin-left', 'auto');
    plot_div.css('margin-right', 'auto');
    placeholder.append(plot_div);
    // TODO: properties.xlabel
    // TODO: properties.ylabel

    main_div.append(placeholder);

    var axis_state = {div: placeholder, properties: properties}; // plot_div?

    figure_state.axes[properties.handle] = axis_state;
    figure_state.cur_plot = properties.handle;
  }

  function setFig(index) {
    cur_figure = index;
    $('#plot_container').children().hide();
    var figure_state = figure_plotter.figure_states[index];
    figure_state.div.css('display', 'block');
    if (!figure_state.drawn) {
      draw_figure_state(figure_state);
    } else {
      redraw_current_figure();
    }
  }

  function clickedTab(e) {
    e.preventDefault();
    var index = $(this).data('index');
    // SYNC WITH OCTAVE AND OTHER CLIENTS
    // socket.emit('message', {
    //   from: 'plot',
    //   to: 'computer',
    //   type: 'figure',
    //   passback: '0',
    //   figure_id: index,
    //   client_id: client_id
    // });
    // DONT SYNC WITH OCTAVE AND OTHER CLIENTS
    setFig(index);
    update_figure_tabs();
    return false;
  }
  function clickedCloseTab(e) {
    e.preventDefault();
    var index = $(this).data('index');
    socket.emit('message', {
      from:'plot',
      to: 'computer',
      type:'closefig',
      passback:'0',
      figure_id: index
    });
    return false;
  }

  function update_figure_tabs() {
    $('#figure_tabs').empty();

    var activeright=false;
    for(var k in figure_plotter.figure_states) {

      var newLi = $('<div>').addClass('tab').attr('id', 'figure_tab_' + k);
      newLi.css({'width':'50px', 'text-align':'center'});

      if (activeright) {newLi.addClass('activeright'); activeright=false;}
      if (k == cur_figure) {newLi.addClass('active'); activeright=true;}

      var newLink = $('<span>').text(k);
      newLi.append(newLink);

      newLi.data('index', k);
      newLi.click(clickedTab);

      var newCloseLink = $('<span>').addClass('closetab').html('&times;');
      newCloseLink.data('index', k);
      newCloseLink.click(clickedCloseTab);
      newLi.append(newCloseLink);

      $('#figure_tabs').append(newLi);
    }
  }

  exports.SwitchTab = function(diff) {
    return function() {
      var tabs = $('#figure_tabs .tab');
      var index = null;
      for (var i = 0; i < tabs.length; i++) {
        if ($(tabs[i]).hasClass('active')) {
          index = i;
          break;
        }
      }
      console.log('index', index);
      if (index !== null) {
        var new_index = (index + diff + tabs.length) % tabs.length;
        tabs[new_index].click();
      }
    };
  };
  exports.NextTab = exports.SwitchTab(1);
  exports.PrevTab = exports.SwitchTab(-1);

  socket.on('message', function(msg) {handle_message(msg);});

  function redraw_current_figure() {
    for (var h in figure_plotter.axis_plotters) {
      var axis_plotter = figure_plotter.axis_plotters[h];
      axis_plotter.redraw({delay: true});
    }
  }

  var plot_resize_wait_time = 100;

  var resize_plot = utils.exec_sparsely(function() {
    update_toolbar_buttons();
    redraw_current_figure();
  }, plot_resize_wait_time);

  $('#plot_window').resize(resize_plot);
  $(window).resize(resize_plot);
  resize_plot();

  function make_new_figure(index) {
    var figure_state = {};
    figure_state.axes = {};
    figure_state.drawn = false;
    figure_state.cur_plot = null;


    var main_div = $('<div class="figure_div"></div>');
    $('#plot_container').append(main_div);
    figure_state.div = main_div;

    figure_plotter.figure_states[index] = figure_state;

    return figure_state;
  }

  var MessageHandlers = {
    plot_tile_fetched: function(mess) {
      //if (mess.client_id == client_id) { // TODO: bring this back?
        if (mess.handle in figure_plotter.axis_plotters) {
          // handles are a string representing a float with precisely 100 zeroes past the decimal
          var axis_plotter = figure_plotter.axis_plotters[mess.handle];
          axis_plotter.tileFetched(mess);
        }
      //}
    },

    // OUR INTERMEDIATE STATIC PLOT SOLUTION
    static_plot_close:  function(mess) {
      // CloseFigure(mess.id);
    },
    static_plot_update:  function(mess) {
    },
  };

  // NOTE: THIS LOGIC IS MIRRORED IN IPC_INSTANCE
  function handle_message(mess) {
    //console.log('HANDLE_MESSAGE:' + JSON.stringify(mess));

    if (mess.type in MessageHandlers) {
      return MessageHandlers[mess.type](mess);
    }

    if (mess.type == 'last_plot_id') {
      console.log('comparing plot ids', last_plot_id, mess.last_plot_id);
      if (last_plot_id < mess.last_plot_id) {
        console.log('asking for update');
        logEvent({
          type: 'last_plot_id',
          data: 'last_plot_id:' + last_plot_id + ' vs ' + ' mess.last_plot_id ' + mess.last_plot_id
        });
        socket.emit('message', {
          from: 'plot',
          to: 'computer',
          type: 'update_plots',
          passback: '0'
        });
      }
      return;
    }

    if (mess.plot_id) {
      console.log('Updating Plot Id to ' + mess.plot_id);
      last_plot_id = mess.plot_id;
    }
    if (mess.type == 'hello') {
      return;
    } else if (mess.type == 'redraw') {
      //console.log('GOT REDRAW COMMAND', mess)
      redraw_figures(mess.graphics_object, mess.hello);
      return;
    } else if (mess.type == 'no_plot') {
      console.log('GOT NO PLOT!!!!');
      reset_figure_plotter();
      exports.hide();
      //$('#plot_window').empty();
    } else if (mess.type == 'loading') {
      // Specialize this more
      logEvent({
        type: 'graph_loading'
      });
      exports.open_if_new();
      exports.show();
      if (mess.id) {
        show_loading_modal($('#plot_window'), mess.id);
      } else {
        show_loading_modal($('#plot_window'), 'plot_loading');
      }
      return;
    } else if (mess.type == 'hide_loading') {
      console.log('GOT: hide_loading');
      logEvent({
        type: 'graph_hide_loading'
      });
      if (mess.loading_id) {
        hide_loading_modal(mess.loading_id);
      } else {
        hide_loading_modal('plot_loading');
      }
      if (mess.error) { show_error(mess.error); }
      return;
    } else if (mess.type == 'plot_error') {
      hide_loading_modal('plot_loading');
      show_error(mess.error_message);
      return;
    } else if (mess.type == 'figure_shared') {
      if (client_id == mess.client_id) {
        if (!share_cb[mess.id]) {console.log('share cb missing?', mess.id); return;}
        share_cb[mess.id](mess.file);
        delete share_cb[mess.id];

        if (mess.error) { show_error(mess.error); }
      }
    //} else if (mess.type == 'savefig') {
    //  save_fig(mess.figure_id, mess.filepath);
    } else {
      console.log('UNHEARD MESSAGE', mess);
    }
    logEvent({
      type: 'after_graph_draw',
      id: mess.id
    });
    hide_loading_modal('plot_loading');
  }

  function save_fig(fig_id, path) {
    var loading_id = show_loading_modal($('#plot_window'));
    socket.emit('message', {
      from: 'plot',
      to: 'computer',
      type: 'savefig',
      figure_id: fig_id,
      path: path,
      loading_id: loading_id,
      client_id: client_id
    });
  }

  function save_current_fig() {
    $('#files_modal_input').val('untitled.png');
    trigger_files_modal($('body'), {action: 'Save Figure', focus_name_input: true},
                        ['/'], modal_file_viewer, function(crumbs, name) {
      var path = ensure_valid_location(crumbs.join('/') + '/' + name);
      save_fig(cur_figure, path);
    });
  }
  exports.save_current_fig = save_current_fig;

  function reset_current_fig() {
    // note: resets all figures, not just current
    redraw_figures();
  }
  exports.reset_current_fig = reset_current_fig;

  // NEED TO SHARE THE FIG, MEANING A COPY TO GLUSTER, AND THEN A COPY TO PUBLIC
  // SEE: message type: figure_shared
  // TODO: find a better way to pass callback?
  var share_cb = {}; // callback mapping
  function share_figure(figure_id, cb) {
    //if (userName == 'anonymous') {
    //  show_main_modal(text_box('Please log in to create embed links!'))
    //} else {
      var id = 'shared_figure' + uuid.v1();
      show_loading_modal($('body'), id);
      socket.emit('message', {
        from: 'plot',
        to: 'computer',
        type: 'sharefig',
        passback: '0',
        figure_id: figure_id,
        client_id: client_id,
        id: id
      });
      share_cb[id] = function(file) {
        console.log('SHARE CB CALLED');
        hide_loading_modal(id);
        cb(file);
      };
    //}
  }

  function share_current_fig() {
    share_figure(cur_figure, function(file) {
      var parts = document.domain.split('.');
      var subdomain = parts[0];
      var domain = parts.slice(1).join('.');

      var url = '//' + subdomain + '-80.' + domain + '/' + file;
      window.open(url);
    });
  }

  var cur_mode = 'zoom_in';

  function set_mode(mode) {
    for (var h in figure_plotter.axis_plotters) {
      var axis_plotter = figure_plotter.axis_plotters[h];
      axis_plotter.set_mode(mode);
    }
    cur_mode = mode;

    var modes = ['pan', 'zoom_out', 'zoom_in'];
    var found = false;
    for (var i in modes) {
      var mode2 = modes[i];
      if (mode == mode2) {
        found = true;
        $('.plot_' + mode2 + '_button').addClass('active');
      } else {
        $('.plot_' + mode2 + '_button').removeClass('active');
      }
    }
    if (!found) {
      console.log('Unknown mode: ' , mode);
    }
  }

  set_mode('zoom_in');

  var plot_buttons = [
    {
      icon: 'fa fa-search-plus',
      text: 'Zoom In',
      click: function() { set_mode('zoom_in'); },
      classes: 'plot_zoom_in_button'
    }, {
      icon: 'fa fa-search-minus',
      text: 'Zoom Out',
      click: function() { set_mode('zoom_out'); },
      classes: 'plot_zoom_out_button'
    }, {
      icon: 'fa fa-arrows',
      text: 'Pan',
      click: function() { set_mode('pan'); },
      classes: 'plot_pan_button',
      withSeparator: true
    }, {
      icon: 'fa fa-refresh',
      text: 'Reset',
      click: reset_current_fig,
      hotkey: [exports.name, 'reset']
    }, {
      icon: 'fa fa-save', text: 'Save',
      click: save_current_fig,
      hotkey: [exports.name, 'save']
      // attrs: { title: utils.cmd_key + '-S'}
    }, {
      icon: 'fa fa-globe',
      text: 'Share',
      click: share_current_fig,
      hotkey: [exports.name, 'share']
    }];

  function update_toolbar_buttons() {
    update_buttons($('#plot_button_toolbar'), plot_buttons, 35);
    set_mode(cur_mode);
  }
  update_toolbar_buttons();
  exports.update_toolbar_buttons = update_toolbar_buttons;

  socket.on('message', function(msg) { handle_message(msg); });

});

})(GraphManager);
