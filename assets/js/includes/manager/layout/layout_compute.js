/* jshint -W117 */

// if not already defined by layout_compute
var cur_layout_version = 1.1;

try {
  var version = JSON.parse(localStorage.layout_version);
  var cur_conf = JSON.parse(localStorage.cur_conf);
  var cur_layout = localStorage.cur_layout;
  var layouts = JSON.parse(localStorage.layouts);
  var is_hidden = JSON.parse(localStorage.layout_is_hidden);
  var maximized = localStorage.layout_maximized;

  if (version == cur_layout_version) {
    var Layout = {
      version: version,
      is_hidden: is_hidden,
      maximized: maximized,
      cur_layout: cur_layout,
      layouts: layouts
    };
  }
} catch(e){
  console.log('FAILED to get from localstorage', e, e.stack);
}

if ((typeof Layout === 'undefined') || (Layout.version !== cur_layout_version)) {
  var Layout = {
    version: cur_layout_version, // DECIMAL
    is_hidden: {}, // SET; 'files_container' -> true
    maximized: '', // STRING; 'editor_container'
    cur_layout: 'Default', // STRING
    layouts: {
      'Default':  {
        type: 'horizontal',
        parts: [
          {
            weight: 1,
            name: 'files_container',
          },
          {
            weight: 3,
            name: 'editor_container',
          },
          {
            weight: 3,
            type: 'vertical',
            // weights default to 1
            parts: [
              {
                name: 'shell_container',
              },
              {
                type: 'horizontal',
                parts: [
                  {
                    name: 'plot_window',
                  },
                  {
                    name: 'html_container',
                  },
                  {
                    name: 'chat_container',
                  },
                ]
              }
            ]
          },
        ]
      },
      'Inverted':  {
        type: 'horizontal',
        parts: [
          {
            weight: 2,
            type: 'vertical',
            parts: [
              {
                type: 'horizontal',
                parts:  [
                  {
                    name: 'files_container',
                  },
                  {
                    weight: 2,
                    name: 'editor_container',
                  }
                ]
              },
              {
                name: 'shell_container',
              },
            ]
          },
          {
            type: 'vertical',
            parts: [
              {
                name: 'plot_window',
              },
              {
                name: 'html_container',
              },
              {
                name: 'chat_container',
              },
            ]
          }
        ]
      },
    }
  };
}

(function(exports) {
  'use strict';

  // conf is of the form:
  //
  // {
  //   type: 'vertical',
  //    parts: [
  //      {
  //        weight: 2,
  //        type: 'horizontal',
  //        parts: [...]
  //      },
  //      {
  //        // weight defaults to 1
  //        // type defaults to panel
  //        type: 'panel',
  //        name: 'files_container',
  //      }
  //    ]
  // }

  function conf_is_hidden(conf) {
    if ((conf.type == 'panel') || (!conf.type)) {
      return exports.is_hidden[conf.name];
    } else {
      for (var i = 0; i < conf.parts.length; i++) {
        var hidden = conf_is_hidden(conf.parts[i]);
        if (!hidden) {return false;}
      }
      return true;
    }
  }

  function hh() {
    var h = compute_settings.hide_top_bar ? 0 : $('#top_bar').height();
    return h + 'px';
  }

  function create_config(conf) {
    var divs = {};
    var splits = {};

    function helper( conf,
                                   t,b,l,r ,
                                   t_split, b_split, l_split, r_split,
                                   prefix
                                 ) {
      var i;
      if ((conf.type == 'horizontal') || (conf.type == 'vertical')) {
        var parts = [];
        for (i = 0; i < conf.parts.length; i++) {
          var part = conf.parts[i];
          if (!conf_is_hidden(part)) { parts.push(part); }
        }

        var n = parts.length;
        var axis = (conf.type == 'horizontal') ? 'x': 'y';

        // normalize weights
        var z = 0;
        for (i = 0; i < n; i++) {
          if (!parts[i].weight) {parts[i].weight = 1;}
          if (parts[i].weight < 0) {
            console.log('wtf negative weight?', prefix, parts[i].weight);
            parts[i].weight = 0;
          }
          z += parts[i].weight;
        }
        for (i = 0; i < n; i++) {
          parts[i].weight = parts[i].weight / z;
        }

        var scale = (axis == 'x') ? (r-l) : (b-t);

        var midpoints = [];
        var next = (axis == 'x') ? l : t;
        midpoints.push(next);
        for (i = 0; i < n; i++) {
          next = next + parts[i].weight * scale;
          midpoints.push(next);
        }
        midpoints[midpoints.length - 1] = (axis == 'x') ? r : b; // should already be almost true

        // create splitters
        var splitters = [];
        splitters.push( ((axis == 'x') ? l_split : t_split) );
        for (i = 0; i < n-1; i++) {
          var name = 'split' + prefix + '_' + axis + i;
          var splitter =  {
            name: name,
            axis: axis
          };
          var div_splitter = {};

          if (axis == 'x') {
            splitter.left = [];
            splitter.right = [];

            if (t_split) { t_split.bottom.push(name); }
            if (b_split) { b_split.top.push(name); }

            div_splitter.t = 100*t +'%';
            div_splitter.b = 100*(1-b) +'%';
            div_splitter.l = 100*midpoints[i+1] + '%';
            div_splitter.r = 'auto';
            if (t==1) { div_splitter.t = hh(); }
          } else {
            splitter.top = [];
            splitter.bottom = [];

            if (l_split) { l_split.right.push(name); }
            if (r_split) { r_split.left.push(name); }

            div_splitter.t = 100*midpoints[i+1] + '%';
            div_splitter.b = 'auto';
            div_splitter.l = 100*l + '%';
            div_splitter.r = 100*(1-r) + '%';
          }

          // global splitter list
          splits[name] = splitter;
          divs[name] = div_splitter;
          splitters.push(splitter);
        }
        splitters.push( ((axis == 'x') ? r_split : b_split) );

        // recurse
        for (i = 0; i < n; i++) {
          if (axis == 'x') {
            helper( parts[i],
                    t, b, midpoints[i], midpoints[i+1],
                    t_split, b_split, splitters[i], splitters[i+1],
                    prefix + '_' + axis + i);
          } else {
            helper( parts[i],
                    midpoints[i], midpoints[i+1], l, r,
                    splitters[i], splitters[i+1], l_split, r_split,
                    prefix + '_' + axis + i);
          }
        }

      } else {
        // conf.type == 'panel'
        divs[conf.name] =  {
          t: (100*t) + '%',
          b: (100*(1-b)) + '%',
          l: (100*l) + '%',
          r: (100*(1-r)) + '%',
        };
        if (t === 0) { divs[conf.name].t = hh(); }

        if (r_split) { r_split.left.push(conf.name); }
        if (l_split) { l_split.right.push(conf.name); }
        if (t_split) { t_split.bottom.push(conf.name); }
        if (b_split) { b_split.top.push(conf.name); }
      }
    }

    helper(conf,
        0, 1, 0, 1,
        null, null, null, null,
        '');

    var res = {
      divs: divs,
      splits: splits
    };
    return res;
  }

  // update a configuration's weights in-place to reflect resized divs
  function update_preconfig(conf, compiled_conf) {

    var resizer_half_w = 5;

    function helper( conf,
                                   b,t,l,r ,  // in pixels
                                   prefix
                                 ) {
      if ((conf.type == 'horizontal') || (conf.type == 'vertical')) {
        var part;
        var parts = [];
        var hidden_weight = 0;
        for (var i = 0; i < conf.parts.length; i++) {
          part = conf.parts[i];
          if (conf_is_hidden(part)) {
            hidden_weight += part.weight;
            continue;
          }
          parts.push(part);
        }

        var axis = (conf.type == 'horizontal') ? 'x': 'y';

        var first;
        var last;
        if (axis == 'x') {
          first = l; last = r;
        } else {
          first = b; last = t;
        }
        var start;
        var end = first;

        var n = parts.length;
        for (i = 0; i < n; i++) {
          part = parts[i];

          start = end;
          if (i < n -1) {
            var splitter = compiled_conf.divs['split' + prefix + '_' + axis + i];
            // splitter.l and splitter.t must be in percents
            if (axis == 'x') {
              end = parseFloat(splitter.l) / 100;
            } else {
              end = parseFloat(splitter.t) / 100;
            }
          } else {
            end = last;
          }
          var weight = (1-hidden_weight) * (end-start) / (last - first);
          part.weight = weight;
          //console.log(prefix, 'weight', weight, end, start, last, first)
          if (axis == 'x') {
            helper( part,
                    b, t, start, end,
                    prefix + '_' + axis + i);
          } else {
            helper( part,
                    start, end, l, r,
                    prefix + '_' + axis + i);
          }
        }
      } else {
        // conf.type == 'panel'
        // do nothing
      }
    }

    helper(conf,
        0, 1, 0, 1,
        '');
  }

  //////////////////////////////////////////////////////
  // NEW LAYOUT
  //////////////////////////////////////////////////////

  var dropdowns = {};

  function update_layout(layout) {
    if (dropdowns[layout]) {
      $('.layout_dropdown').css('font-weight', 'normal');
      dropdowns[layout].css('font-weight', 'bold');
      exports.cur_layout = layout;
    } else {
      console.error('Unknown layout', layout);
    }
  }
  exports.update_layout = update_layout;

  function switch_layout(layout) {
    updateCurLayout(); // update the weights
    update_layout(layout);
    render_configs();
  }
  exports.switch_layout = switch_layout;

  var layout_names = [];
  for (var l in exports.layouts) { layout_names.push(l); }
  $('#toggle_layout').click(function() {
    var i = layout_names.indexOf(exports.cur_layout);
    var next_layout = layout_names[(i + 1) % layout_names.length];
    switch_layout(next_layout);
    return false;
  });

  function setup_layout(layout) {
    var link = $('<a>').addClass('layout_dropdown').text(layout)
      .attr({'role': 'button', 'data-toggle': 'modal'})
      .hover(function() { switch_layout(layout); })
      .click(function() { switch_layout(layout); });
    $('#layouts_dropdown').append( $('<li>').append(link) );
    dropdowns[layout] = link;
  }
  for (var layout in exports.layouts) {
    setup_layout(layout);
  }

  function updateCurLayout() {
    if (exports.cur_conf && (!exports.maximized)) {
      update_preconfig(exports.layouts[exports.cur_layout], exports.cur_conf);
    }
  }

  function store_layout_settings() {
    localStorage.layout_is_hidden = JSON.stringify(exports.is_hidden);
    localStorage.layouts = JSON.stringify(exports.layouts);
    localStorage.cur_layout = exports.cur_layout;
    if (exports.cur_conf) {
      localStorage.cur_conf = JSON.stringify(exports.cur_conf);
    }
    localStorage.layout_maximized = exports.maximized;
    localStorage.layout_version = exports.version;

    // store on server in case of snapshot
    exports.save();
  }

  exports.save = function() {
    get_socket('meta').emit('message', {
      from:'term',
      to:'computer',
      type:'save_layout',
      layout: {
        is_hidden: exports.is_hidden,
        layouts: exports.layouts,
        cur_layout: exports.cur_layout,
        cur_conf: exports.cur_conf,
        maximized: exports.maximized,
        version: exports.version,
      }
    });
  };

  function render_configs() {
    var conf;
    if (exports.maximized) {
      conf = create_config({type: 'panel', name: exports.maximized});
    } else {
      exports.cur_conf = create_config(exports.layouts[exports.cur_layout]);
      conf = exports.cur_conf;
    }
    //console.log('RENDERING CONF', conf)
    LayoutMGR.Render(conf);

    // todo: do this in a cleaner  way
    $('#plot_window').resize();

    store_layout_settings();
  }

  LayoutMGR.on('drag', function() {
    updateCurLayout();
    store_layout_settings();
  });

  exports.maximize = function(pane) {
    exports.maximized = pane;
    store_layout_settings();
  };

  exports.minimize = function() {
    exports.maximized = '';
    store_layout_settings();
  };

  update_layout(exports.cur_layout);

  render_configs();
  // this is only necessary b/c top bar height changes
  var last_hh = hh();
  setInterval(function() {
    if (hh() !== last_hh) {
      last_hh = hh();
      console.log('rendering bc top bar height changed');
      render_configs();
    }
  }, 100);



  exports.toggle_pane = function(name) {
      updateCurLayout(); // update the weights
      exports.is_hidden[name] = !exports.is_hidden[name];
      render_configs();
  };
  exports.close_pane = function(name) {
      updateCurLayout(); // update the weights
      exports.is_hidden[name] = true;
      render_configs();
  };
  exports.open_pane = function(name) {
      updateCurLayout(); // update the weights
      exports.is_hidden[name] = false;
      render_configs();
  };

  exports.render_configs = render_configs;

})(Layout);

// initialize layout

jQuery(function() {
  var name;

  for (name in Managers) {
    if (Layout.is_hidden[Managers[name].panel_id]) {
      Managers[name].close();
    } else {
      Managers[name].open();
    }
  }
  var force_layout = getParameterByName('layout');
  if (force_layout) { Layout.update_layout(force_layout);}

  for (name in Managers) {
    var param = getParameterByName(name.toLowerCase());
    if (param) {
      if (param == 'hidden') {
        Managers[name].close();
      }
    }
  }

  for (name in Managers) {
    if (Layout.maximized == Managers[name].panel_id) {
      Managers[name].maximize();
    }
  }
  for (name in Managers) {
    if ((compute_settings.maximize) && (compute_settings.maximize == name.toLowerCase())) {
      Managers[name].maximize();
    }
  }


  Layout.render_configs();
});

