"use strict";

function clear_plot_state(plot_state) {
  plot_state.type = null;
  if(!plot_state.series) {
    plot_state.series = [];
  } else {
    plot_state.series.length = 0; // clears in place (not necessary technically)
  }
  plot_state.surface_plot = null;
  plot_state.big_plot = null;

  plot_state.title = null;
  plot_state.aspect_ratio = 'normal';
  // This doesn't change when user zoom/pans
  plot_state.xaxis = {min: null, max: null};
  plot_state.yaxis = {min: null, max: null};


  plot_state.options = {
    hold:false,
    // default properties for each line
    lines:{show:true, lineWidth:1},
    points:{show:false, radius: 4, symbol:"circle", fill: false, fillColor: null},
    shadowSize:0,
    xaxis:{min: null, max: null, autoscaleMargin: null, tickLength: -6, tickColor: "rgba(0,0,0,1)" },
    yaxis:{min: null, max: null, autoscaleMargin: null, tickLength: -6, tickColor: "rgba(0,0,0,1)" },
    zoom: { interactive: true },
    pan: { interactive: true }, 
    colors : [ 
      "rgb(0,0,255)",
      "rgb(0,255,0)",
      "rgb(255,0,0)",
      "rgb(0,255,255)",
      "rgb(255,0,255)",
      "rgb(255,255,0)",
      "rgb(0,0,0)" 
    ],  
    grid: {
      show: true,
      color: "rgb(1, 1, 1)",
      aboveData: false ,
      labelMargin:10,
    },    
    legend: {
      show: false ,
      labelFormatter: null, // use function to make lines editable(shows dialog with options for that line)
      labelBoxBorderColor: "rgb(1,1,1)",
      noColumns: 1,
      position: "ne",
      margin: 10,
      backgroundColor: "rgb(1,1,1)",
      backgroundOpacity: .1,
      container: null
    }
  };
}

function draw_plot_state_on_placeholder(plot_state, placeholder, is_thumbnail) {
  var plot_div = $('.plot_div', placeholder);
  plot_div.empty();
  if(plot_state && plot_state.type) {
    var title_div = $('.title_div', placeholder);
    if ((plot_state.title) && (!is_thumbnail)) {
      title_div.text(plot_state.title.label);
      title_div.css('font-size', plot_state.title.fontsize);
      title_div.css('font-family', plot_state.title.font);
    }
    if (is_thumbnail) {
      delete plot_state.options.yaxis.axisLabel
      delete plot_state.options.xaxis.axisLabel
      //delete plot_state.options.yaxis.axisLabelUseCanvas;
      //delete axis.axisLabelFontSizePixels = json_data.fontsize;
      //delete axis.axisLabelFontFamily = json_data.font;
    }

    // actual works well for title but not other placeholders...
    var available_width = placeholder.width();
    var available_height = placeholder.height() - title_div.actual('height');

    if (plot_state.aspect_ratio == 'normal') {
      plot_div.width(available_width); 
      plot_div.height(available_height);
    } else if (plot_state.aspect_ratio == 'square') {
      var side_length = Math.min(available_width, available_height);
      plot_div.width(side_length); 
      plot_div.height(side_length); 
    } else {
      console.log("UNKNOWN ASPECT_RATIO TYPE");
    }

    if(plot_state.big_plot) {
      if (plot_state.big_plot.options.y_adjust) {
        plot_state.big_plot.update_from_axis_change(plot_state.xaxis.min, plot_state.xaxis.max, plot_state.yaxis.min, plot_state.yaxis.max)
      } else {
        plot_state.big_plot.update_plot();
      }
    } else if(plot_state.type=="2d") {
      var plot = $.plot(plot_div, plot_state.series, plot_state.options);
    } else if( plot_state.type == "3d") {
      // update surface_plot options, such as grid
      plot_state.surface_plot.draw();
    }

    var updateWindow = function(plot) {
      var axes = plot.getAxes();
      plot_state.options.xaxis.min = axes.xaxis.min;
      plot_state.options.xaxis.max= axes.xaxis.max;
      plot_state.options.yaxis.min = axes.yaxis.min;
      plot_state.options.yaxis.max= axes.yaxis.max;

    };
    
    plot_div.bind('plotpan', function (event, plot) {updateWindow(plot)});
    plot_div.bind('plotzoom', function (event, plot) {updateWindow(plot)});

  } 
}

function draw_figure_state(figure_state, placeholder_info, is_thumbnail) {
  for (var k in figure_state.plot_states) {
    draw_plot_state_on_placeholder(figure_state.plot_states[k], placeholder_info.placeholders[k], is_thumbnail);
  }
}

function set_pan_button(plot_state) {
  if (plot_state.options.pan.interactive) {
    //$("pan_toggle_plot").removeClass("btn").addClass("btn-dark");
    $('#pan_button_text').html("Pan Off");
  } else {
    //$("pan_toggle_plot").removeClass("btn-dark").addClass("btn");
    $('#pan_button_text').html("Pan On");
  }
}

function set_zoom_button(plot_state) {
  if (plot_state.options.zoom.interactive) {
    //$("zoom_toggle_plot").removeClass("active").addClass("active");
    $('#zoom_button_text').html("Zoom Off");
  } else {
    //$("zoom_toggle_plot").removeClass("active");
    $('#zoom_button_text').html("Zoom On");
  }
}


function is_vector(x) {
  if (x) {
    return x.rows == 1 || x.cols == 1 
  } else {
    return false;
  }
}

function zip(x,y) {
  if(x.length != y.length) return null;
  
  // zip them up
  var points = [];
  for( var j=0; j<x.length; ++j){
    points.push( [x[j],y[j]] );
  }
  return points;
}

// plotting:
// If a single data argument is supplied, it is taken as the set of y
// coordinates and the x coordinates are taken to be the indices of the
// elements, starting with 1.

// If the x is a vector and y is a matrix, then the columns (or rows) of y are
// plotted versus x. (using whichever combination matches, with columns tried
// first.)

// If the x is a matrix and y is a vector, y is plotted versus the columns (or
// rows) of x. (using whichever combination matches, with columns tried first.)

// If both arguments are vectors, the elements of y are plotted versus the
// elements of x.

// If both arguments are matrices, the columns of y are plotted versus the
// columns of x. In this case, both matrices must have the same number of rows
// and columns and no attempt is made to transpose the arguments to make the
// number of rows match.


// should we swap at the end, or is this good?
function push_lines_vec_mat(x, y, series, transpose, MakeSeries)  {
  // plot columns of y vs x
  if( (y.rows==x.rows) || (y.rows==x.cols) ) {
    for(var j=0; j<y.cols; ++j) {
      var points = [];
      var s = j*y.rows;
      for(var k=0; k<y.rows; ++k){
        if(transpose) {
          points.push( [y.data[s+k], x.data[k] ]);
        } else {
          points.push( [x.data[k], y.data[s+k]]);
        }
      }
      series.push(MakeSeries(points));
    }
  } else {
    // rows of y match with x, i.e, y.cols == x.data.length
    for(var j=0; j<y.rows; ++j) {
      var points = [];
      var s = y.rows;
      for(var k=0; k<y.cols; ++k){
        if(transpose) {
          points.push( [y.data[j+k*s], x.data[k]]);
        } else {
          points.push( [x.data[k], y.data[j+k*s]]);
        }
      }
      series.push(MakeSeries(points));
    }
  }
}

var symbolToHandler = {
  "x": function (ctx, x, y, radius, shadow) {
    // pi * r^2 = (2s)^2  =>  s = r * sqrt(pi)/2
    var size = radius * Math.sqrt(Math.PI) / 2;
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x - size, y + size);
    ctx.lineTo(x + size, y - size);
  },
  
  "+": function (ctx, x, y, radius, shadow) {
    var size = radius;
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y + size);
    ctx.lineTo(x, y - size);
  },
  "*": function(ctx, x, y, radius, shadow) {
    // first do cross
    var size = radius * Math.sqrt(Math.PI) / 2;
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x - size, y + size);
    ctx.lineTo(x + size, y - size);
    
    // then do +
    size = radius;
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y + size);
    ctx.lineTo(x, y - size);
  },
  "s": function (ctx, x, y, radius, shadow) {
    // pi * r^2 = (2s)^2  =>  s = r * sqrt(pi)/2
    var size = radius * Math.sqrt(Math.PI) / 2;
    ctx.rect(x - size, y - size, size + size, size + size);
  },

  "d": function (ctx, x, y, radius, shadow) {
    // pi * r^2 = 2s^2  =>  s = r * sqrt(pi/2)
    var size = radius * Math.sqrt(Math.PI / 2);
    ctx.moveTo(x - size, y);
    ctx.lineTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
  },
  "^": function (ctx, x, y, radius, shadow) {
    // pi * r^2 = 1/2 * s^2 * sin (pi / 3)  =>  s = r * sqrt(2 * pi / sin(pi / 3))
    var size = radius * Math.sqrt(2 * Math.PI / Math.sin(Math.PI / 3));
    var height = size * Math.sin(Math.PI / 3);
    ctx.moveTo(x - size/2, y + height/2);
    ctx.lineTo(x + size/2, y + height/2);
    if (!shadow) {
      ctx.lineTo(x, y - height/2);
      ctx.lineTo(x - size/2, y + height/2);
    }
  },
  "v": function (ctx, x, y, radius, shadow) {
    // pi * r^2 = 1/2 * s^2 * sin (pi / 3)  =>  s = r * sqrt(2 * pi / sin(pi / 3))
    var size = radius * Math.sqrt(2 * Math.PI / Math.sin(Math.PI / 3));
    var height = -(size * Math.sin(Math.PI / 3));
    ctx.moveTo(x - size/2, y + height/2);
    ctx.lineTo(x + size/2, y + height/2);
    if (!shadow) {
      ctx.lineTo(x, y - height/2);
      ctx.lineTo(x - size/2, y + height/2);
    }
  },
  // TODO: <, >, p, h
};

var colorToString = {
  "b" : "rgb(0,0,255)",
  "g" : "rgb(0,255,0)",
  "r" : "rgb(255,0,0)",
  "c" : "rgb(0,255,255)",
  "m" : "rgb(255,0,255)",
  "y" : "rgb(255,255,0)",
  "k" : "rgb(0,0,0)", 
  "w" : "rgb(255,255,255)"
};

var legend_args = { 
  'off' : true, 
  'toggle' : true,
  'hide' : true, 
  'show' : true,
  'boxoff' : true
}

/* converts serialized matrix from octave into an array */
function parse_vec(x) {
  var res = [];
  var cols = x.cols;
  for(var j=0; j<cols; ++j){
    res.push( x.data[j] );
  }
  
  return res;
}

/* converts serialized matrix from octave into an array of arrays */
function parse_mat(x) {
  var res = [];
  var rows = x.rows, cols = x.cols;
  for(var i=0; i<rows; ++i){
    var row = [];
    for(var j=0; j<cols; ++j){
      row.push( x.data[i + j*rows] );
    }
    res.push(row);
  }
  res.rows = rows;
  res.cols = cols;
  return res;
}

function add_subplot(figure_state, placeholder_info, mnp) {
  var plot_state = {};
  clear_plot_state(plot_state);
  var index = mnp.join('.')
  figure_state.plot_states[index] = plot_state;
  figure_state.cur_plot = index;

  var main_div = placeholder_info.main_div;

  var m = mnp[0], n = mnp[1], p = mnp[2];

  var col = (p-1) % n;
  var row = Math.floor((p-1) / n);
  
  var placeholder = $('<div></div>');
  placeholder.css('position', 'absolute');
  function place_placeholder() {
    placeholder.css('left', (col * main_div.width() / n) + 'px');
    placeholder.css('top', (row * main_div.height() / m) + 'px');
    // THIS DOESNT WORK WHEN PANES RESIZE...
    placeholder.css('width', (main_div.width() / n));
    placeholder.css('height', (main_div.height() / m));

    // THIS DOESNT WORK IN NEWEST CHROME...
    //placeholder.css('margin-left', (100 * col / n) + '%');
    //placeholder.css('margin-top', (100 * row / m ) + '%');
    // THIS DOESNT WORK IF DIV IS HIDDEN? (FOR CAROUSEL)
    //placeholder.css('width', (100  / n) + '%');
    //placeholder.css('height', (100  / m ) + '%');

  }

  // TODO: This is bad code.  basically a hack
  $('#plot_container').resize(place_placeholder);
  $(window).resize(place_placeholder);
  place_placeholder();

  placeholder_info.placeholders[index] = placeholder;

  var center = $('<center></center>')
  var title_div = $('<div class="title_div"></div>');
  title_div.css('text-align', 'center');
  placeholder.append(title_div);
  var plot_div = $('<div class="plot_div"></div>');
  plot_div.css('margin-left', 'auto');
  plot_div.css('margin-right', 'auto');
  placeholder.append(plot_div);

  main_div.append(placeholder);
}

var plot_state_mapping = {
    "bars" : "2d" 
  , "contour" : "2d" 
  , "image" : "2d" 
  , "plot" : "2d" 
  , "big_mono_plot" : "2d" 
  , "mesh" : "3d" 
  , "surf" : "3d" 
  , "scatter3" : "3d" 
}

// handlers take:  (message, plot_state)
// TODO: mention above helper functions somewhere in docs?  how to do image?
var PlotHandlers = {
}

// TODO: do some caching, only load these when commands called
// Remove from embed_requirements and compute.html
// get_script_sync('/plots/bar.js')
// get_script_sync('/plots/plot.js')
// get_script_sync('/plots/contour.js')

function RegisterPlotHandler(plot_type, fn) {
  PlotHandlers[plot_type] = fn;
}
    
/* parses json_data and puts it into series and styles */
function parse_oct(json_data, figure_state, placeholder_info, is_public) {
  if (json_data.type == "subplot") {
    var mnp = [json_data.m, json_data.n, json_data.p]
    var index = mnp.join('.');
    if (!(index in figure_state.plot_states)) {
      add_subplot(figure_state, placeholder_info, mnp);
    }
    figure_state.cur_plot = index;
    return;
  }

  if (!figure_state.cur_plot) {
    add_subplot(figure_state, placeholder_info, [1,1,1]);
  }
  
  var plot_state = figure_state.plot_states[figure_state.cur_plot];
  var placeholder = $('.plot_div', placeholder_info.placeholders[figure_state.cur_plot]);
  if (json_data.type in plot_state_mapping) {
    plot_state.type = plot_state_mapping[json_data.type];
  }

  if (json_data.type in PlotHandlers) {
    PlotHandlers[json_data.type](json_data, plot_state);
    return;
  }

  if (json_data.type == "title") {
    plot_state.title = {
      label: json_data.label,
      fontsize:  json_data.fontsize,
      font:  json_data.font,
    };
  } else if (json_data.type == "xlabel" || json_data.type == "ylabel") {
    if (json_data.type == "xlabel") {
      var axis = plot_state.options.xaxis;
    } else if (json_data.type == "ylabel") {
      var axis = plot_state.options.yaxis;
    }
    // Can generalize by adding more labels to these lists
    axis.axisLabel = json_data.label;
    axis.axisLabelUseCanvas = false;
    axis.axisLabelFontSizePixels = json_data.fontsize;
    axis.axisLabelFontFamily = json_data.font;
  } else if (json_data.type == "axis") {
    // TODO
    if (json_data.option == 'normal' || json_data.option == 'square') {
      // TODO: handle 'equal' and 'image', here as well
      plot_state.aspect_ratio = json_data.option;
    } else if (json_data.option == 'tight') {
    } else if (json_data.option == 'fill') {
    // } else if (json_data.option == 'vis3d') {
    } else if (json_data.option == 'off') {
    } else if (json_data.option == 'on') {
    } else {
      console.log("Invalid axis option", json_data.option);
    }
    return;
  } else if (json_data.type == "caxis") {
    // TODO
    console.log("CAXIS NOT IMPLEMENTED");
    return;
  } else if (json_data.type == "xlim" || json_data.type == "ylim" || json_data.type == "zlim") {
    if (json_data.type == "xlim") {
      var axis = plot_state.options.xaxis;
      var fixed_axis = plot_state.xaxis;
    } else if (json_data.type == "ylim") {
      var axis = plot_state.options.yaxis;
      var fixed_axis = plot_state.yaxis;
    } else {
      // TODO
      if (plot_state.type == '3d') {
        console.log("ZLIM NOT IMPLEMENTED");
      }
      return;
    }
    if (json_data.mode == "auto") {
      axis.min = null;
      axis.max = null;
      fixed_axis.min = null;
      fixed_axis.max = null;
      if (json_data.min != null) {
        axis.min = parseFloat(json_data.min);
        fixed_axis.min = parseFloat(json_data.min);
      }
      if (json_data.max != null) {
        axis.max = parseFloat(json_data.max);
        fixed_axis.max = parseFloat(json_data.max);
      }
    } else if (json_data.mode == "manual") {
      // TODO: Need to trigger a plot first, for the case where they are null 
      fixed_axis.min = axis.min;
      fixed_axis.max = axis.max;
    } else {
      console.log("Something went wrong while setting axis limits");
    }
  } else if(json_data.type == "legend") {
    // iterate through labels, and assign them to the lines in the 
    // graph, and turn on legend
    var labels = json_data.args;
    if((labels.length == 1) && (labels[0] in legend_args) ) {
      if(labels[0]=='off'){
        plot_state.options.legend.show = false;
      } else if(labels[0]=='toggle') {
        plot_state.options.legend.show = !plot_state.options.legend.show;
      } else if(labels[0]=='hide') {
        plot_state.options.legend.show = false;
      } else if(labels[0]=='show' || labels[0]=='on') {
        plot_state.options.legend.show = true;
      }
      if(plot_state.options.legend.show == true) {
        // if on, iterate through and assign labels to series 
        // that have no label
        var counter = 1;
        for(var ser in plot_state.series ) {
          if(!ser.label) {
            ser.label = "data"+counter;
            counter++;
          }
        }
      }
    } else {
      if(labels.length >= 2) {
        if(labels[labels.length-2] == "location") {
          var loc = labels[labels.length-1];
          if(loc in {'ne':1,'nw':1, 'se':1, 'sw':1} ) {
            plot_state.options.legend.position = loc;
            labels.length-=2;
          }
        }
      }
      for( var i=0; i<labels.length; ++i) {
        if(i < plot_state.series.length) {
          plot_state.series[i].label = labels[i];
        }
      }
      plot_state.options.legend.show = true;
    }
  } else if(json_data.type == "zoom") {
    if(json_data.value=='off'){
      plot_state.options.zoom.interactive = false;
    } else if( json_data.value =='on') {
      plot_state.options.zoom.interactive = true;
    } else if (json_data.value =='toggle'){
      plot_state.options.zoom.interactive = !plot_state.options.zoom.interactive;
    }
    set_zoom_button(plot_state)
  } else if(json_data.type == "pan") {
    if(json_data.value=='off'){
      plot_state.options.pan.interactive = false;
    } else if( json_data.value =='on') {
      plot_state.options.pan.interactive = true;
    } else if (json_data.value =='toggle'){
      plot_state.options.pan.interactive = !plot_state.options.pan.interactive;
    }
    set_pan_button(plot_state)
  } else if(json_data.type == "hold") {
    if(json_data.value=='off'){
      plot_state.options.hold = false;
    } else if( json_data.value =='on') {
      plot_state.options.hold = true;
    } else if (json_data.value =='toggle'){
      plot_state.options.hold = !plot_state.options.hold;
    }
  } else if(json_data.type == "grid") {
    var options = plot_state.options;
    if(json_data.value=="toggle"){
      if(options.xaxis.tickLength==null) {
        json_data.value = "off";
      } else {  
        json_data.value = "on";
      }
    } 
    // intentional: not an else, because "toggle" turns into "on" or "off" 
    if(json_data.value=="on"){
      options.xaxis.tickLength = null;
      options.yaxis.tickLength = null;
      options.xaxis.tickColor = "rgba(0,0,0,.3)";
      options.yaxis.tickColor = "rgba(0,0,0,.3)";
    } else if(json_data.value=="off"){
      options.xaxis.tickLength = -6;
      options.yaxis.tickLength = -6;
      options.xaxis.tickColor = "rgba(0,0,0,1)";
      options.yaxis.tickColor = "rgba(0,0,0,1)";
    }
  } else if(json_data.type == "mesh" || json_data.type == "surf" || json_data.type == "scatter3") {

    if(!plot_state.surface_plot || !plot_state.options.hold) {
      plot_state.surface_plot = get_surface_plot(placeholder[0]);
    }

    if (json_data.type == "scatter3") {
      var xvalues = json_data.x, 
          yvalues = json_data.y, 
          zvalues = json_data.z,
          svalues = json_data.s,
          cvalues = json_data.c;

      var data = {}
      data.xValues = parse_vec(xvalues);
      data.yValues = parse_vec(yvalues);
      data.zValues = parse_vec(zvalues);
      if (svalues) {data.sizes = parse_vec(svalues);}
      if (cvalues) {data.colors = parse_vec(cvalues);}

      scatter3(plot_state.surface_plot, data);
    } else {
      var xvalues = json_data.x, 
          yvalues = json_data.y, 
          zvalues = json_data.z,
          cvalues = json_data.c;
  
      if(is_vector(xvalues)) {
        var xvalues = { rows: zvalues.rows, cols:zvalues.cols, data:[] }
        for(var i=0; i<zvalues.cols; ++i){
          for(var j=0; j<zvalues.rows; ++j){
            xvalues.data.push(json_data.x.data[i]);
          }
        }
      }
      if(is_vector(yvalues)) {
        var yvalues = { rows: zvalues.rows, cols:zvalues.cols, data:[] }
        for(var i=0; i<zvalues.cols; ++i){
          for(var j=0; j<zvalues.rows; ++j){
            yvalues.data.push(json_data.y.data[j]);
          }
        }
      }
  
      var data = {}
  
      if (xvalues) {data.xValues = parse_mat(xvalues);}
      if (yvalues) {data.yValues = parse_mat(yvalues);}
      data.zValues = parse_mat(zvalues);
      if (cvalues) {data.colors = parse_mat(cvalues);}
  
      if (json_data.type == "mesh") {
        mesh(plot_state.surface_plot, data);
      } else {
        surf(plot_state.surface_plot, data);
      }
    }
  } else if(json_data.type == "image") {
    var img = new Image();
    
    // TODO: FIX THIS!  ... for embeds
    try {
    if (json_data.file.slice(0,7) == 'http://') {
      img.src = json_data.file;
    } else {
      img.src = figure_state.url + '/' + json_data.file;
      console.log('here2')
      console.log(figure_state.url)
    }

    plot_state.series.push({
      data: [[img, json_data.xlow, json_data.ylow, json_data.xhigh, json_data.yhigh]],
      images: { show: true, anchor: "center", alpha: json_data.alpha } 
    });

    var t = new Date().getTime();
    img.onload = function() {
      var time_taken = new Date().getTime() - t;
      console.log('loading time:' + time_taken);
      $('#plot_container').trigger('resize'); // draw!
      $('body').trigger('resize'); // for embeds!
    }
    } catch (e) {}

  } else if(json_data.type == "big_mono_plot") {
    // TODO: FIX THIS ... for embeds
    try {
      // TODO:
      //MonotonicBigPlot(json_data.id, {}, placeholder, plot_state.series, plot_state.options);

      //var plot_url = figure_state.url  + encodeURIComponent('/' + json_data.id + '.bigplot');
      //if (is_public) {
      //  var plot_url = '/plot/' + json_data.id + '.bigplot';
      //  //var plot_url = '/bigplot/' + json_data.id + '.bigplot';
      //} else {
        var plot_url = figure_state.url + '/' + json_data.id + '.bigplot';
      //}
      plot_state.big_plot = new MonotonicBigPlot(plot_url, {y_adjust: (json_data.y_adjust == 'on')}, placeholder, plot_state.series, plot_state.options);
    } catch (e) {}
  } else {
     console.log("UNKNOWN TYPE", json_data.type);
  }
}

