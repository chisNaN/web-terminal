/* jshint ignore:start */

'use strict';

function fix_octave_array(arr) {
  if (!arr) {return []};
  if (arr.length === undefined) {return [arr];}
  return arr;
}

function flatten_octave_array(arr) {
  var arr = fix_octave_array(arr);
  for (var i = 0; i < arr.length; i ++ ) {
    if ((arr[i]) && (arr[i].length == 1)) {
      arr[i] = arr[i][0];
    }
  }
  return arr;
}

function octave_to_rgbColor(octave_color) {
  return 'rgb(' + octave_color.map(function(x) {return Math.round(x * 256);}).join(',') + ')';
}

// Add ability to draw markers
// See:  http://www.mathworks.com/help/matlab/ref/linespec.html
CanvasRenderingContext2D.prototype.drawMarker = function (type, x, y, s) {
  this.beginPath();
  this.save();
  this.translate(x, y);

  var r = s / 2;

  var that = this;

  function draw_ngon(n, k) {
    // draws a regular n-gon centered at origin, with radius r,
    // with a point at the north
    // if k is specified, move by k on the outer edge each time
    if (k === undefined) {k = 1;}
    that.moveTo(0, -r);
    for (var i = 0; i < n; i++) {
      that.rotate(2 * Math.PI * k / n);
      that.lineTo(0, -r);
    }
  }

  if (type == '+') {
    // an open cross
    //var f = 1/3; // ratio of cross armwidth to cross wingspan, e.g. 1 would be a square
    //this.rect(- r * f, - r, s * f, s);
    //this.rect(- r, - r *f, s, s * f);

    this.moveTo(-r, 0);
    this.lineTo( r, 0);
    this.moveTo(0, -r);
    this.lineTo(0,  r);
  } else if (type == 'o') {
    this.arc(0, 0, r, 0, 2 * Math.PI);
  } else if (type == '*') {
    var f = 1/8; // ratio of width of spoke to height
    for (var i = 0; i < 4; i++) {
      this.rotate(Math.PI / 4);
      this.rect(- r * f, -r, s * f, s);
    }
  } else if (type == '.') {
    // TODO:  what is this supposed to do?
    this.arc(0, 0, r, 0, 2 * Math.PI);
  } else if (type == 'x') {
    var f = 1/8; // ratio of width of spoke to height
    this.rotate(Math.PI / 4);
    this.rect(- r * f, -r, s * f, s);
    this.rotate(Math.PI / 2);
    this.rect(- r * f, -r, s * f, s);
  } else if (type == 's' || type == 'square' ) {
    this.rect(- r, -r, s, s);
  } else if (type == 'd' || type == 'diamond' ) {
    this.rotate(Math.PI / 4);
    this.rect(- r, -r, s, s);
  } else if (type == 'p' || type == 'pentagram' ) {
    draw_ngon(5, 2);
  } else if (type == 'h' || type == 'hexagram' ) {
    draw_ngon(3);
    this.rotate(Math.PI / 3);
    draw_ngon(3);
  } else if (type == '^') {
    draw_ngon(3);
  } else if (type == 'v') {
    this.rotate(Math.PI);
    draw_ngon(3);
  } else if (type == '>') {
    this.rotate(Math.PI / 2);
    draw_ngon(3);
  } else if (type == '<') {
    this.rotate(3 * Math.PI / 2);
    draw_ngon(3);
  } else {
    console.log('Marker type of', type, 'not supported');
  }
  this.restore();
  this.closePath();

}

// Add ability to draw other lines
CanvasRenderingContext2D.prototype.styledLine = function (xs, ys, linestyle) {

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2)*(x1-x2) + (y1-y2)*(y1-y2));
  }

  var n = xs.length;
  if (! ((n> 0) && (n == ys.length))) {return;}

  this.moveTo(xs[0], ys[0]);

  if (linestyle == '--') {
    var pattern = [[10, 'lineTo'],
                   [10, 'moveTo']];
  } else if (linestyle == ':') {
    var pattern = [[2, 'lineTo'],
                   [5, 'moveTo']];
  } else if (linestyle == '-.') {
    var pattern = [[10, 'lineTo'],
                   [4, 'moveTo'],
                   [2, 'lineTo'],
                   [4, 'moveTo'],
                  ];
  } else if (linestyle == '-') {
    var pattern = [[Infinity, 'lineTo']]
  } else if (linestyle == 'none') {
    return; // this is pointless.
    var pattern = [[Infinity, 'moveTo']]
  } else {
    console.log("Unknown lineStyle:  " + linestyle);
    var pattern = [[10, 'lineTo']];
  }

  var cur_segment = 0; // index in the pattern
  var cur_pattern = [pattern[cur_segment][0], pattern[cur_segment][1]];

  var cur_target = 1; // index in xs and ys
  var target_x = xs[cur_target];
  var target_y = ys[cur_target];
  // current point
  var cur_x = xs[0];
  var cur_y = ys[0];

  while (cur_target < n) {
    var d = dist(cur_x, cur_y, target_x, target_y)

    if (target_x === null || target_y === null || cur_x === null || cur_y === null
        || d == Infinity) { // TODO: deal with d = infinity properly?
      cur_target += 1;
      if (cur_target == n) {return;}
      cur_x = xs[cur_target - 1];
      cur_y = ys[cur_target - 1];
      this.moveTo(cur_x, cur_y);
      target_x = xs[cur_target];
      target_y = ys[cur_target];
    } else if (d < cur_pattern[0]) {

      // cur_segment doesn't change
      cur_pattern[0] = cur_pattern[0] - d;
      cur_x = target_x;
      cur_y = target_y;

      cur_target +=1;
      target_x = xs[cur_target];
      target_y = ys[cur_target];

      this[cur_pattern[1]](cur_x, cur_y);

    } else {
      // travel cur_pattern[0] / d of the way
      var dX = (target_x - cur_x) * (cur_pattern[0] / d);
      var dY = (target_y - cur_y) * (cur_pattern[0] / d);
      cur_x += dX;
      cur_y += dY;

      this[cur_pattern[1]](cur_x, cur_y);

      cur_segment = (cur_segment + 1) % pattern.length;
      cur_pattern = [pattern[cur_segment][0], pattern[cur_segment][1]];
    }

  }
};

////////////////////
// DRAWABLES
////////////////////

function AxisImageDrawable(image, x1, y1, x2, y2) {
  this.image = image;

  this.xmin = x1;
  this.ymin = y1;
  this.xmax = x2;
  this.ymax = y2;

  //this.options = options;

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.drawImage(this.image, this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
  };
  return this;
}

function ImageDrawable(image, x1, y1, x2, y2) {
  this.image = image;

  this.xmin = x1;
  this.ymin = y1;
  this.xmax = x2;
  this.ymax = y2;

  //this.options = options;

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.drawImage(this.image, tx(this.xmin), ty(this.ymax), tx(this.xmax) - tx(this.xmin), ty(this.ymin) - ty(this.ymax));
  };
  return this;
}

function RectangleDrawable(x, y, w, h, options) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.options = options;

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.strokeStyle= "#000";
    ctx.rect(tx(this.x), ty(this.y), tx(this.x + this.w) - tx(this.x) , ty(this.y + this.h) - ty(this.y));
    ctx.stroke();
  };
  return this;
}

function MatImageDrawable(options) {
  this.options = options;

  this.draw = function(ctx, tx, ty, canvas) {

    // TODO: USE CDATA
    var m = options.m;
    var n = options.n;
    if (!options.XData.length) {options.XData = [options.XData];}
    if (!options.YData.length) {options.YData = [options.YData];}
    var xlen = (options.XData.length == 1) ?  1 : ((options.XData[1] - options.XData[0])  / m) ;
    var ylen = (options.YData.length == 1) ?  1 : ((options.YData[1] - options.YData[0])  / n) ;
    var xstart = options.XData[0];
    var ystart = options.YData[0];

    // for (var i = 0; i < options.XData.length; i++) {
    //   for (var j = 0; j < options.YData.length; j++) {

    var xlo;
    var xhi = xstart - (0.5 * xlen);

    for (var i = 0; i < m; i++) {
      xlo = xhi;
      xhi = xlo + xlen;

      var ylo;
      var yhi = ystart - (0.5* ylen);

      for (var j = 0; j < n; j++) {
        ylo = yhi;
        yhi = ylo + ylen;

        ctx.beginPath();
        ctx.fillStyle= octave_to_rgbColor([options.r[i*n +j], options.g[i*n+j], options.b[i*n+j]]);
        ctx.rect(tx(xlo)-1, ty(ylo)-1, tx(xhi) - tx(xlo) +2 , ty(yhi) - ty(ylo) + 2);
        ctx.fill();
      }
    }
  };
  return this;
}


function TextDrawable(options) {
  //console.log("TEXT DRAWABLE OPTIONS", options)
  this.options = options;
  // TODO: lots more options!
  this.draw = function(ctx, tx, ty, canvas) {
    // TODO: draw outer rectangle
    ctx.save();
    // http://www.mathworks.com/help/matlab/ref/text_props.html

    ctx.font = this.options.FontSize + "pt " + this.options.FontName;
    ctx.fillStyle = octave_to_rgbColor(this.options.Color);
    ctx.textAlign = this.options.HorizontalAlignment;
    var vert_align_map = {
      'top': 'top',
      'cap': 'top',
      'middle': 'middle',
      'baseline': 'bottom',
      'bottom': 'bottom'
    }
    ctx.textBaseline = vert_align_map[this.options.VerticalAlignment] || 'middle';

    ctx.translate(tx(this.options.Position[0]), ty(this.options.Position[1]));
    ctx.rotate(this.options.Rotation * Math.PI / 180);
    ctx.fillText(this.options.String, 0, 0);

    ctx.restore();
  }
}

function PatchDrawable(options) {
  //console.log("PATCH DRAWABLE OPTIONS", options)
  this.options = options;

  // why is this flattening necessary?  oh well...
  var tmp_x = flatten_octave_array(this.options.XData);
  var tmp_y = flatten_octave_array(this.options.YData);
  var n = tmp_x.length;
  this.x = [];
  this.y = [];
  for (var k =0; k < n; k++) {
    if ((tmp_x[k] !== null) && (tmp_y[k] !== null)) {
      this.x.push(tmp_x[k]);
      this.y.push(tmp_y[k]);
    }
  }

  //console.log(this.options.XData)
  this.x = flatten_octave_array(this.options.XData);
  this.y = flatten_octave_array(this.options.YData);

  // TODO: lots more options!
  this.draw = function(ctx, tx, ty, canvas) {
    // TODO: draw outer rectangle
    ctx.beginPath();
    //ctx.strokeStyle = octave_to_rgbColor(this.options.Color);
//    console.log('color', this.options.CData);
    var n = this.x.length;
    //console.log('patch 2')
      //console.log(this.options)
      //console.log(this.x)
      //console.log(this.y)
//    console.log(this.x[n-1], this.y[n-1])

    var xs = this.x.map(function(x) {return tx(x)});
    var ys = this.y.map(function(y) {return ty(y)});
    ctx.styledLine(xs, ys, this.options.LineStyle);

    //ctx.moveTo(tx(this.x[n-1]), ty(this.y[n-1]))
    ////ctx.moveTo(tx(this.x[0]), ty(this.y[0]))
    //for (var k = 0; k < n; k++) {
    //  ctx.lineTo(tx(this.x[k]), ty(this.y[k]))
    //}
    //ctx.closePath();
    //ctx.stroke();
    // TODO: fill should be based on winding number?

    //ctx.font = this.options.FontSize + "pt " + this.options.FontName;
    //ctx.fillStyle = octave_to_rgbColor(this.options.Color)
    //ctx.textAlign = this.options.HorizontalAlignment;
    //ctx.translate(tx(this.options.Position[0]), ty(this.options.Position[1]));
    //ctx.rotate(this.options.Rotation * Math.PI / 180);
    //ctx.fillText(this.options.String, 0, 0);
  }
}

function LineDrawable(x, y, options) {
  this.x = fix_octave_array(x);
  this.y = fix_octave_array(y);

  if (options.Color === undefined) {options.Color = [0,0,0];}
  if (options.LineStyle === undefined) {options.LineStyle = "-";}
  if (options.LineWidth === undefined) {options.LineWidth = 0.5;}
  if (options.Marker === undefined) {options.Marker = "none";}
  if (options.MarkerEdgeColor === undefined) {options.MarkerEdgeColor = "auto";}
  if (options.MarkerFaceColor === undefined) {options.MarkerFaceColor = "none";}
  if (options.MarkerSize === undefined) {options.MarkerSize = 6;}

  if (options.MarkerEdgeColor == 'auto') {
    options.MarkerEdgeColor = options.Color;
  }

  // TODO:  should try to use axis and figure color properties
  // http://www.mathworks.com/help/matlab/ref/line_props.html
  if (options.MarkerFaceColor == 'auto') {
    options.MarkerFaceColor = options.Color;
  }

  this.options = options;

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.lineCap = 'butt'; //'round';
    ctx.lineWidth = this.options.LineWidth;
    ctx.strokeStyle = octave_to_rgbColor(this.options.Color);

    var xs = this.x.map(function(x) {return tx(x)});
    var ys = this.y.map(function(y) {return ty(y)});
    ctx.styledLine(xs, ys, this.options.LineStyle);
    ctx.stroke();

    if (this.options.MarkerEdgeColor !== 'none') {
      ctx.strokeStyle = octave_to_rgbColor(this.options.MarkerEdgeColor);
    }

    if (this.options.MarkerFaceColor !== 'none') {
      ctx.fillStyle = octave_to_rgbColor(this.options.MarkerFaceColor);
    }

    // keep linewidth!  it's used for the markers
    if (this.options.Marker !== 'none') {
      for (var i = 0; i < xs.length; i++) {
        // divide size to make it more like octave?
        if ((xs[i] === null) || (ys[i] === null)) {continue;}
        ctx.drawMarker(this.options.Marker, xs[i], ys[i], this.options.MarkerSize);

        if (this.options.MarkerEdgeColor !== 'none') {ctx.stroke();}
        if (this.options.MarkerFaceColor !== 'none') {ctx.fill();}

        // TODO: do this
        if (this.options.Marker == '.') {ctx.fillStyle = ctx.strokeStyle; ctx.fill();}
      }
    }

  };
  return this;
}

function AxisTextDrawable(text, x, y, rotation, options) {
  this.x = x;
  this.y = y;
  this.text = text;
  this.rotation = rotation;

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}


function AxisDrawable(options) {
  this.options = options;

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.lineWidth = this.options.axesLineWidth;
    ctx.lineCap = 'square';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    var xmin = this.options.margin_left - (this.options.axesLineWidth / 2);
    var xmax = canvas.width - this.options.margin_right + (this.options.axesLineWidth / 2);
    var ymin = canvas.height - this.options.margin_bot + (this.options.axesLineWidth / 2);
    var ymax = this.options.margin_top - (this.options.axesLineWidth / 2);
    ctx.moveTo(xmin, ymax);
    ctx.lineTo(xmin, ymin);
    ctx.lineTo(xmax, ymin);
    ctx.stroke();
  };
}

function TicksDrawable(direction, ticks, options) {
  this.direction = (direction && (direction !== 'y')) ? 'x' : 'y';
  this.ticks = fix_octave_array(ticks);

  this.tickLength = (options.tickLength || 10);
  this.tickWidth = (options.tickWidth || 1);
  this.tickColor = '#000';

  this.gridWidth = (options.gridWidth || 1);
  this.gridColor = '#DDD';

  this.options = options;

  this.fitNumberStringToWidth = function(ctx, text, maxw) {
    // return text;
    //console.log('text', text)
    var textw = ctx.measureText(text).width;

    if (textw > maxw) {
      var num = parseFloat(text);

      if (num == 0) { console.log('num was 0??'); return '0' }
      var raw = num + '';

      var power = Math.floor(Math.log(Math.abs(num)) / Math.log(10));
      var base = num / Math.pow(10, power);
      var scientific =  base + 'e' + power;

      var text = (scientific.length < raw.length) ? scientific : raw;

      var textw = ctx.measureText(text).width;

      var iters = 0;
      while (textw > maxw) {
        iters ++;
        if (iters == 100) {console.log("HUNDRED ITERS", num, base, power); break;}
        var base = base + '';
        if (base.length == 1) { break;}

        // chop off a digit
        if (base[base.length - 1] == '.') {base = base.slice(0,-1);}
        base = parseFloat(base.slice(0,-1) + '0') + '';

        var scientific =  base + 'e' + power;
        var raw = parseFloat(scientific) + '';

        var text = (scientific.length < raw.length) ? scientific : raw;

        textw = ctx.measureText(text).width;
      }
    }
    return text;
  }

  this.draw = function(ctx, tx, ty, canvas) {
    ctx.lineWidth = this.tickWidth;
    ctx.strokeStyle = this.tickColor;
    ctx.beginPath();
    ctx.lineCap = 'square';

    ctx.font = "10pt Arial";
    ctx.fillStyle = '#000';

    if (!this.ticks) {console.log("NO TICKS?", this.ticks); return;}
    if (this.direction == 'x') {
      var maxw = this.options.XTickLabelWidth;
      //ctx.textBaseline = 'top';
      ctx.textAlign = 'center';

      for (var i = 0; i < this.ticks.length; i++) {
        var tick = this.ticks[i];
        var text = this.fitNumberStringToWidth(ctx, tick + '', maxw);
        var xt = tx(tick);
        if ((xt < canvas.width - this.options.margin_right) && (xt > this.options.margin_left)) {
          ctx.moveTo( xt, canvas.height - this.options.margin_bot);
          ctx.lineTo( xt, canvas.height - this.options.margin_bot - this.tickLength);
          ctx.fillText(text, xt, canvas.height - this.options.margin_bot + this.options.XTickLabelHeight, maxw);
        }
      }
    } else {
      var right_padding = 5;
      var maxw = this.options.YTickLabelWidth - right_padding;

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (var i = 0; i < this.ticks.length; i++) {
        var tick = this.ticks[i];
        var text = this.fitNumberStringToWidth(ctx, tick + '', maxw);
        var yt = ty(tick);
        if ((yt < canvas.height - this.options.margin_bot) && (yt > this.options.margin_top)) {
          ctx.moveTo(this.options.margin_left, yt);
          ctx.lineTo(this.options.margin_left + this.tickLength, yt);
          ctx.fillText(text, this.options.margin_left - right_padding, yt, maxw);
        }
      }
    }

    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = this.gridWidth;
    ctx.strokeStyle = this.gridColor;
    ctx.beginPath();
    ctx.lineCap = 'square';

    if (this.direction == 'x') {
      if (this.options.XGrid == 'on') {
        for (var i = 0; i < this.ticks.length; i++) {
          var tick = this.ticks[i];
          var xt = tx(tick);
          if ((xt < canvas.width - this.options.margin_right) && (xt > this.options.margin_left)) {
            ctx.moveTo( xt, canvas.height - this.options.margin_bot);
            ctx.lineTo( xt, this.options.margin_top);
          }
        }
      }
    } else {
      if (this.options.YGrid == 'on') {
        for (var i = 0; i < this.ticks.length; i++) {
          var tick = this.ticks[i];
          var yt = ty(tick);
          if ((yt < canvas.height - this.options.margin_bot) && (yt > this.options.margin_top)) {
            ctx.moveTo(this.options.margin_left, yt);
            ctx.lineTo(canvas.width - this.options.margin_right, yt);
          }
        }
      }
    }
    ctx.closePath();
    ctx.stroke();

  };
}

function canvasAxisPlotter(socket, plot_div, global_cache, options) {
  // TODO: this is causing a plot_window resize to occur.  Currently,
  //console.log("INITIALIZING CANVAS PLOTTER", options);

  //console.log("opts", options)

  //////////////////////
  // INITIALIZE CANVASES
  //////////////////////

  var axis_canvas_z_index = 2;
  var canvas_z_index = 1;
  if (options.is_legend) {
    axis_canvas_z_index += 10;
    canvas_z_index += 10;
  }

  var axis_canvas = $('<canvas>').addClass('new_plot_canvas');
  if (options.is_legend) {
    axis_canvas.addClass('axis_legend');
  } else {
    axis_canvas.addClass('axis_not_legend');
  }
  axis_canvas.css('z-index', axis_canvas_z_index);
  plot_div.append(axis_canvas);
  axis_canvas = axis_canvas[0];
  var axis_ctx = axis_canvas.getContext('2d');
  if (options.is_legend) {
    axis_canvas.style.border = 1;
  } else {
    axis_canvas.style.border = 0;
  }

  var canvas = $('<canvas>')
    .addClass('new_plot_canvas')
    .addClass('not_axis')
    .css('z-index', canvas_z_index);
  plot_div.append(canvas);
  canvas = canvas[0];
  var ctx = canvas.getContext('2d');
  canvas.style.border = 0;

  var event_canvas = axis_canvas; // which canvas gets used for the event handling?

  //////////////////////
  // SET UP OPTIONS
  //////////////////////

  this.options = {};
  for (var prop in options) {
    this.options[prop] = options[prop];
  }

  // TODO: zdir, zscale
  if ((options.XDir !== 'normal') && (options.XDir !== 'reverse')) {
    this.error("why is there no valid Xdir? "+ options.XDir);
    this.options.XDir = 'normal';
  }
  if ((options.YDir !== 'normal') && (options.YDir !== 'reverse')) {
    this.error("why is there no valid Ydir? "+ options.YDir);
    this.options.YDir = 'normal';
  }

  if ((options.XScale !== 'linear') && (options.XScale !== 'log')) {
    this.error("why is there no valid XScale? "+ options.XScale)
    this.options.XScale = 'linear';
  }
  if ((options.YScale !== 'linear') && (options.YScale !== 'log')) {
    this.error("why is there no valid YScale? "+ options.YScale)
    this.options.YScale = 'linear';
  }

  //var auto_margin = Math.max(50, Math.round(Math.min(canvas.clientWidth, canvas.clientHeight) * 0.1));

  this.options.XLabelHeight = 30;
  this.options.YLabelWidth = 30;
  this.options.TitleHeight = 50;

  this.options.YTickLabelWidth = 50;
  this.options.XTickLabelHeight = 15;
  this.options.XTickLabelWidth = 50;

  this.options.margin_left   = this.options.YTickLabelWidth + (this.options.YLabel ? this.options.YLabelWidth : 0);
  this.options.margin_bot    = this.options.XTickLabelHeight + (this.options.XLabel ? this.options.XLabelHeight : 0);

  this.options.margin_right   = 5;
  this.options.margin_top     = 5 + (this.options.Title ? this.options.TitleHeight : 0);

  this.options.tickLength    = (options.tickLength || 10);
  this.options.axesLineWidth = (options.axesLineWidth || 2);

  this.mode = (options.mode !== undefined ? options.mode : 'zoom_in');

  // NEVER ABLE TO PAN/ZOOM
  if (options.is_legend) {
    this.mode = 'never';
  }
  if (options.ndims == 3) {
    this.mode = 'never';
  }
  if (options.XScale == 'log' || options.YScale == 'log') {
    // TODO
  }

  if (options.is_legend) {
    this.options.margin_left = 0;
    this.options.margin_right = 0;
    this.options.margin_bot = 0;
    this.options.margin_top = 0;
  }

  this.set_mode = function(mode) {
    if (this.mode == 'never') { return; }

    this.mode = mode;
    if (mode == 'zoom_in') {
      //$('').css('cursor', 'crosshair');
    } else if (mode == 'zoom_out'){
    } else if (mode == 'pan'){
      if (!this.options.local_plotting) {
        tile_req_q.push({
          one_to_cover: false,
          prefetch_pan: true,
        });
      }
    } else if (mode == 'never'){
      // mode will never change again!
    } else {
      this.error('Canvas axis plotter,  Unknown mode: ' + mode);
    }
  };

  this.set_mode(this.mode);

  // TODO: remove this?
  this.handle = this.options.handle;

  this.xmin = this.options.XLim[0];
  this.xmax = this.options.XLim[1];
  this.ymin = this.options.YLim[0];
  this.ymax = this.options.YLim[1];
  var sx, sy, ox, oy;

  var that = this;

  this.tile_cache = {};
  this.global_cache = global_cache;

  this.log = function() {
    //console.log(Array.prototype.slice.apply(arguments).join(', '));
  };

  this.error = function(message) {
    console.log(message);
  };

  this.assert = function(condition, message) {
    if (!condition) {this.error(message);}
  };

  // tile with hash 'i,j,tile_power_i,tile_power_j,W,H' corresponds to rectangle with coordinates from:
  // i * tile_size_i , j * tile_size_j to (i+1) * tile_size_i, (j+1) * tile_size_j,
  // where tile_size_x = 2^(tile_power_x)

  var select_rect_draw = null;

  // Returns the tick values for a range, given the number of pixels to work with.
  // Tries to have last digit spaced as either:
  // 1.  [blah]0, [blah]1, [blah]2, ...
  // 2.  [blah]0, [blah]2, [blah]4, ...
  //   or
  // 3.  [blah]0, [blah]5, [blah+1]0, ...
  // Tries to have ticks spaced out TICK_PIXEL_SPACING pixels apart

  // TODO: minor ticks
  function get_auto_ticks(min, max, npixels) {
    if (min == max) { min -= 1; max -= 1; }

    var TICK_PIXEL_SPACING = 100; // can be a bit less than half as spaced out

    var approx_nticks = npixels / TICK_PIXEL_SPACING;
    var approx_math_diff = (max - min) / approx_nticks;
    var power = Math.floor(Math.log(approx_math_diff) / Math.log(10));
    var amt = approx_math_diff / Math.pow(10, power);

    if (amt < 2) {amt = 1}
    else if (amt < 5) {amt = 2}
    else if (amt < 10) {amt = 5}
    else {console.log('unexpected amount:', amt, min, max, approx_math_diff,power) };

    var math_diff = amt * Math.pow(10, power);

    var low_i= Math.floor(min / math_diff);
    var high_i= Math.ceil(max / math_diff);

    if (Math.abs(low_i)  + Math.abs(high_i) > 1e16) { // javascript big int problems
      console.log('integers too big', low_i, high_i)
      return [math_diff * low_i, math_diff * high_i];
    }

    var ticks = [];
    for (var i = low_i; i <= high_i; i++) {
      var scientific = (amt * i).toFixed(0) + 'e' + power;

      var precision = (power > 0) ? 0 : -power;
      var raw = (amt * i * Math.pow(10,power)).toFixed(precision)

      var tick = (scientific.length < raw.length) ? scientific : raw;
      if (i == 0) {tick = '0'}

      ticks.push(tick);
    }

    var multiplier = 0;

    return [ticks, multiplier];
  }

  // TRANSFORM FROM MATH INTO CANVAS COORDINATES
  this.update_transform = function() {

    var xleft, xright, ybottom, ytop;
    if (this.options.XDir == 'normal') {
      xleft = this.xmin;
      xright = this.xmax;
    } else {
      xleft = this.xmax;
      xright = this.xmin;
    }

    if (this.options.YDir == 'normal') {
      ybottom = this.ymin;
      ytop = this.ymax;
    } else {
      ybottom = this.ymax;
      ytop = this.ymin;
    }

    sx = (this.canvas_w-this.options.margin_left - this.options.margin_right)/(xright-xleft);
    sy = (this.canvas_h-this.options.margin_bot - this.options.margin_top)/(ybottom-ytop);
    ox = -sx * xleft + this.options.margin_left;
    oy = -sy * ytop +  this.options.margin_top;
    // update transform based on window limits
  };

  this.update_limits = function() {
    // update window limits based on transform
    var xleft = (ox - this.options.margin_left) / (-sx);
    var xright = (this.canvas_w - this.options.margin_left - this.options.margin_right)/sx + xleft;
    var ytop = (oy - this.options.margin_top) / (-sy);
    var ybottom = (this.canvas_h - this.options.margin_bot - this.options.margin_top)/sy + ytop;

    if (this.options.XDir == 'normal') {
      this.xmin = xleft;
      this.xmax = xright;
    } else {
      this.xmin = xright;
      this.xmax = xleft;
    }

    if (this.options.YDir == 'normal') {
      this.ymin = ybottom;
      this.ymax = ytop;
    } else {
      this.ymin = ytop;
      this.ymax = ybottom;
    }
    // TODO: re-ask for data?
  };

  this.canvas_w = null;
  this.canvas_h = null; // size

  this.resize = function() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    axis_canvas.width  = canvas.clientWidth;
    axis_canvas.height = canvas.clientHeight;
    this.canvas_w = canvas.clientWidth;
    this.canvas_h = canvas.clientHeight;

    // var size = Math.min(w, h);
    this.update_transform();
  };
  this.resize();

  function drag(pixels_dx, pixels_dy) {
    ox += pixels_dx;
    oy += pixels_dy;
    that.update_limits();
  }

  // from math to canvas coordinates
  this.tx = function(x) {
//    if (that.options.XScale == 'log') {
//      return sx*Math.log(x)+ox;
//    }
    return (x === null ? null : sx*x+ox);
  };

  this.ty = function(y) {
    return (y === null ? null : sy*y+oy);
  };

  // from canvas to math coordinates
  this.rx = function(x) {
//    if (that.options.XScale == 'log') {
//      return Math.exp((x -ox) / sx);
//    }
    return (x -ox) / sx;
  };

  this.ry = function(y) {
    return (y -oy) / sy;
  };

  this.getHash = function(tile) {
    return this.handle + ',' + tile.join(',');
  };

  // draws only onto the regular canvas, not the axis canvas

  this.draw_item = function(drawable, clip) {
    //console.log('drawing item', drawable)
    if (draw_callback) {
      //console.log('draw callback', drawable)
      draw_callback();
      draw_callback = null;
    }

    if (clip === undefined) {clip = true;}

    ctx.save();
    if (clip) {
      ctx.beginPath();
      ctx.rect(this.options.margin_left, this.options.margin_top,
               canvas.width - this.options.margin_left - this.options.margin_right,
               canvas.height - this.options.margin_bot - this.options.margin_top);
      ctx.clip();
      ctx.closePath();
    }

    ctx.beginPath();
    if (last_clear) {
    //console.log('drawing drawable')
      //console.log(Date.now() - last_clear);
      last_clear = null;
    }
    drawable.draw(ctx, this.tx, this.ty, canvas);
    ctx.closePath();
    if (clip) {
      ctx.restore();
    }
  };

  this.draw_items = function(drawables, clip) {
    drawables.forEach(function(drawable) {that.draw_item(drawable, clip)})
  };

  this.tileFetched = function(message) {

    //console.log('fetched', message.xi, message.xp, message.yi, message.yp, message.W, message.H, message.passback)

    if (message.passback.type == 'fetch_plot_tile') {
      // global cache uses md5, but local can just use this
      var tile = [message.xi, message.xp, message.yi, message.yp, message.W, message.H];
      var hash = this.getHash(tile);

      var xmin = message.xi * Math.pow(2, message.xp-1);
      var xmax = (message.xi+2) * Math.pow(2, message.xp-1);
      var ymin = message.yi * Math.pow(2, message.yp-1);
      var ymax = (message.yi+2) * Math.pow(2, message.yp-1);
    } else {
      var hash = that.handle + ',' + message.W + ',' + message.H;
    }

    // make sure the passback is correct
    if (!(that.tile_cache[hash] && that.tile_cache[hash].id && (that.tile_cache[hash].id == message.passback.id))) {
      if (that.tile_cache[hash]) {
        var supposed_id = that.tile_cache[hash].id
      }  else {
        var supposed_id = 'missing!'
      }
      this.error('Wrong passback? probably from different client.  ' + message.passback.id + ' ' + supposed_id )
      return;
    }

    var now = Date.now();
    that.log("ID", message.passback.id, "SEND TIME", that.tile_cache[hash].time, "RECEIVE TIME", now, "DIFF", now - that.tile_cache[hash].time)

    var res = that.tile_cache[hash];

    // TODO: only redraw if anything not already in cache

    // TODO: this is better, for prefetched zoom
    var drawnow = (res.draw_on_return) && (res.version == redraw_counter);

    unqueue_request(hash);

    var drawables = [];

    if (message.md5 in that.global_cache) {
      // pull from global cache, and done
      drawables = that.global_cache[message.md5];

      that.tile_cache[hash] = {
        status: STATUS_DONE,
        drawables: drawables
      };

      if (drawnow) { that.draw_items(drawables); }
      return;
    }

    // NOTE: this happens because the server resends plot messages for restoring state
    if (!that.tile_cache[hash]) {
      that.tile_cache[hash] = {
        status: STATUS_FETCHING,
        time: Date.now()
      }
    }
    if (that.tile_cache[hash].status == STATUS_DONE) {that.log("WAS ALREADY DONE??");}

    if (message.result.xs) {
      var ln_drawable = new LineDrawable(message.result.xs, message.result.ys)
      drawables.push(ln_drawable);
      that.draw_item(ln_drawable);
    }

    if (message.result.image) {
      var image= new Image();

      image.onload = function() {
        //that.log("IMAGE LOADED!", image.src, xmin, xmax, ymin, ymax)
        that.log("ID", message.passback.id, "LOAD TIME", Date.now());
        if (message.passback.type == 'fetch_plot_tile') {
          var img_drawable = new ImageDrawable(image, xmin, ymin, xmax, ymax);
          if (drawnow) { that.draw_item(img_drawable); }
        } else {
          var img_drawable = new AxisImageDrawable(image, 0, 0, that.canvas_w, that.canvas_h);
          if (drawnow) { that.draw_item(img_drawable, false); }
        }
        drawables.push(img_drawable);
      };
      image.src = message.result.image;
      image.src = "//" + document.domain + message.result.image;
      //that.log("image loading", image.src)
    }

    that.tile_cache[hash].drawables = drawables;
    that.tile_cache[hash].status = STATUS_DONE;
    that.global_cache[message.md5] = drawables;
    return;
  };

  this.try_drawing_tile = function(tile) {
    var hash = this.getHash(tile);
    var result = this.tile_cache[hash];
    var can_draw = result && (result.status == STATUS_DONE);

    if (can_draw) {
      this.draw_items(result.drawables);
    }
    return can_draw;
  };

  this.try_drawing_tiles = function(tiles) {
    tiles.forEach(function(tile) {that.try_drawing_tile(tile)})
  };

  ////////////////////////
  // TILE QUEUEING
  ////////////////////////

  var STATUS_FETCHING = 'fetching';
  var STATUS_DONE = 'done';

  var redraw_counter = 0;
  // doesn't truly clear the queue, but invalidates the current tasks
  function clearQueue() {
    redraw_counter++;
  }

  var tile_q_concurrency = 2;

  var id = uuid.v1();

  var tile_req_q = async.queue(function (options, callback) {
    //console.log("QUEUE OPTIONS", options)
    if (options.full_static) {
      //var dims = that.get_draw_region_dims();
      var W = that.canvas_w; //dims[0];
      var H = that.canvas_h; //dims[1];

      var hash = that.handle + ',' + W + ',' + H;

      var tile_message = {type: 'fetch_plot_full', to: 'computer', from: 'plot', client_id: client_id,
        handle: that.handle, W: W, H: H,
        hash: hash, passback: {is_prefetch: is_prefetch, version: redraw_counter, id: id, type: 'fetch_plot_full'},
        counter: redraw_counter}

    } else {
      var tile_to_fetch = that.get_tile_to_fetch(options);
      var tile = tile_to_fetch[0];
      var is_prefetch = tile_to_fetch[1];

      if (!tile) {
        that.log("no tile!");
        return callback();
      }
      var W = tile[4];
      var H = tile[5];

      if (!((W > 0) && (H > 0))) {
        that.log("WIDTH OR HEIGHT WAS ZERO", W, H);
        return callback();
      }

      var hash = that.getHash(tile);

      var tile_message = {type: 'fetch_plot_tile', to: 'computer', from: 'plot', client_id: client_id,
        handle: that.handle, xi: tile[0], xp: tile[1], yi: tile[2], yp: tile[3], W: W, H: H,
        hash: hash, passback: {is_prefetch: is_prefetch, version: redraw_counter, id: id, type: 'fetch_plot_tile'},
        counter: redraw_counter}
    }

    if (tile_message) {
      that.log("FETCHING NOW", JSON.stringify(tile_message))

      that.log("setting id", hash, id);

      var res = that.tile_cache[hash];
      if (res && (res.status == STATUS_DONE)) {
        that.log("WAS ALREADY DONE");
        if (options.full_static) {
          if (res.drawables && res.drawables.length) {
            that.log("drawing full static", W, H, res.drawables)
            that.draw_items(res.drawables, false);
          } else {
            that.log("WEIRD!! DONE BUT NO DRAWABLES?");
          }
        }
        return callback();
      }

      that.tile_cache[hash] = {
        status: STATUS_FETCHING,
        time: Date.now(),
        callback: callback,
        options: options,
        draw_on_return: (!is_prefetch),
        version: redraw_counter,
        id: id
      };

      socket.emit('message', tile_message);

      var wait_tile_time = 10000;
      setTimeout(function() {
        if (that.tile_cache[hash].id == id) {
          unqueue_request(hash);
        }
      }, wait_tile_time);
    } else {
    }
  }, tile_q_concurrency);


  function unqueue_request(hash) {
    // unqueue
    var res = that.tile_cache[hash];
    if (res) {
      if (res.callback) {
        res.callback();
        if (!that.deleted)  {
          tile_req_q.push(res.options);
        }
        delete res.callback;
      } else {
        if (res.status !== STATUS_DONE) {
          that.error('Tried to unqueue a request that wasnt done');
        }
      }

    } else {
      that.log('caller is ' + arguments.callee.caller.toString().slice(0,40));

      that.log("unqueueing non-existent request?", hash);
    }
  }

  //tile_req_q.drain = function() {
  //    that.log('all items have been processed');
  //};

  this.should_fetch_now = function(tile) {
    var hash = this.getHash(tile);
    var result = this.tile_cache[hash];
    var now = Date.now();
    return (result === undefined) || ((result.status == STATUS_FETCHING) && (result.time < now - 1000));
  };

  this.update_fetch_style = function(tile) {
    // If a tile is fetched as a prefetch tile and is in-flight when
    // we move it into the main view we should change its status
    var hash = this.getHash(tile);
    var result = this.tile_cache[hash];
    if (result && (result.status == STATUS_FETCHING)) {
      result.version = redraw_counter;
      result.draw_on_return = true;
    }
  };

  this.update_fetch_styles = function(tiles) {
    tiles.forEach(function(tile) {that.update_fetch_style(tile)})
  };


  this.redraw_axis_layer = function() {
    if (that.options.ndims != 2)  {return;}

    axis_ctx.clearRect(0, 0, this.canvas_w, this.canvas_h);

    var axis_draw = new AxisDrawable(this.options);
    axis_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);

    if (this.options.XTickMode == 'auto') {
      var res = get_auto_ticks(this.xmin, this.xmax, this.canvas_w - this.options.margin_left - this.options.margin_right);
      var xticks = res[0];
      var xmultiplier = res[1];
      xticks_draw = new TicksDrawable('x', xticks, this.options);
    } else {
      var xticks_draw = new TicksDrawable('x', this.options.XTick, this.options);
    }

    if (this.options.YTickMode == 'auto') {
      var res = get_auto_ticks(this.ymin, this.ymax, this.canvas_h - this.options.margin_bot - this.options.margin_top);
      var yticks = res[0];
      var ymultiplier = res[1];
      yticks_draw = new TicksDrawable('y', yticks, this.options);
    } else {
      var yticks_draw = new TicksDrawable('y', this.options.YTick, this.options);
    }

    xticks_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);
    yticks_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);

    if (this.options.Title) {
      axis_ctx.font = "15pt Arial";
      var title_draw  = new AxisTextDrawable(this.options.Title, (this.options.margin_left + canvas.width - this.options.margin_right) / 2, this.options.TitleHeight / 2, 0, this.options);
      title_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);
    }
    if (this.options.XLabel) {
      axis_ctx.font = "12pt Arial";
      axis_ctx.textBaseline = 'bottom';
      var xlabel_draw = new AxisTextDrawable(
        this.options.XLabel,
        (this.options.margin_left + canvas.width - this.options.margin_right) / 2,
        canvas.height - (this.options.XLabelHeight / 2),
        0,
        this.options);
      var xlabel_draw = new AxisTextDrawable(
        this.options.XLabel,
        (this.options.margin_left + canvas.width - this.options.margin_right) / 2,
        canvas.height,
        0,
        this.options);
      xlabel_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);
    }
    if (this.options.YLabel) {
      axis_ctx.font = '12pt Arial';
      var ylabel_draw = new AxisTextDrawable(
        this.options.YLabel,
        this.options.YLabelWidth / 2,
        (this.options.margin_top + canvas.height - this.options.margin_bot) / 2,
        3 * Math.PI / 2,
        this.options);
      ylabel_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);
    }

    // TODO: should this be here?
    if (select_rect_draw) {
      //select_rect_draw.draw(ctx, this.tx, this.ty, canvas);
      select_rect_draw.draw(axis_ctx, this.tx, this.ty, axis_canvas);
    }
  };

  // TODO: use this more
  this.get_draw_region_dims = function() {
    var w = this.canvas_w - this.options.margin_left - this.options.margin_right;
    var h = this.canvas_h - this.options.margin_bot - this.options.margin_top;
    return [w, h];
  }

  this.get_pixel_dims = function(w, h, scale) { // w and h in math coordinates
    if (scale === undefined) { scale = 0;}
    var region_dims = this.get_draw_region_dims();
    var pixel_w = Math.round(Math.pow(2, -scale) * region_dims[0] * w / (this.xmax - this.xmin));
    var pixel_h = Math.round(Math.pow(2, -scale) * region_dims[1] * h / (this.ymax - this.ymin));

    // means that plot window hidden
    // if (!((pixel_w > 0) && (pixel_h > 0))) {
    //   this.error('tile_W or tile_H non-positive!');
    //   this.log(pixel_w, this.canvas_w, this.options.margin_left, this.options.margin_right, w, this.xmax, this.xmin);
    //   this.log(pixel_h, this.canvas_h, this.options.margin_bot,  this.options.margin_top, h, this.ymax, this.ymin);
    // }

    return [pixel_w, pixel_h];
  };

  // Get default powers for this window size
  this.get_default_powers = function() {
    var xp = Math.ceil(Math.log(this.xmax - this.xmin) / Math.log(2));
    var yp = Math.ceil(Math.log(this.ymax - this.ymin) / Math.log(2));
    return [xp, yp];
  };

  // get tiles of a certain size, with certain offset, to cover a window
  this.get_tiles_of_size_to_cover = function(xmin, xmax, ymin, ymax, xp, xo, yp, yo, scale) {
    if (xo === undefined) {xo = 0;}
    if (yo === undefined) {yo = 0;}
    var default_powers = this.get_default_powers();
    if (xp === undefined) {xp = default_powers[0];}
    if (yp === undefined) {yp = default_powers[1];}

    if ((xo !== 0) || (yo !== 0)) {return that.error("Currently cannot deal with non-zero offsets")}

    var w = Math.pow(2, xp);
    var h = Math.pow(2, yp);

    var pixel_dims = this.get_pixel_dims(w, h, scale);
    var pixel_w = pixel_dims[0];
    var pixel_h = pixel_dims[1];

    var min_i = Math.floor(xmin/w);
    var max_i = Math.ceil(xmax/w) ; // max tile + 1
    var min_j = Math.floor(ymin/h);
    var max_j = Math.ceil(ymax/h) ; // max tile + 1

    var tiles = [];
    // TODO: send requests for most relevant before the pre-fetch ones?
    // also don't trigger redraws on the pre-fetch returns
    for (var i = min_i; i < max_i; i++) {
      for (var j = min_j; j < max_j; j++) {
        tiles.push([2*i, xp, 2*j, yp, pixel_w, pixel_h])
      }
    }

    return tiles;
  };

  this.get_one_to_cover = function(xmin, xmax, ymin, ymax) {
    var default_powers = this.get_default_powers();
    var xp = default_powers[0] + 1;
    var yp = default_powers[1] + 1;

    var w = Math.pow(2, xp);
    var h = Math.pow(2, yp);

    var pixel_dims = this.get_pixel_dims(w, h);
    var pixel_w = pixel_dims[0];
    var pixel_h = pixel_dims[1];

    // choose such that xi * 2^(xp-1) < xmin
    // and              xi * 2^(xp-1) + 2^(xp) > xmax
    var xi = Math.floor(this.xmin / Math.pow(2, xp-1));
    var yi = Math.floor(this.ymin / Math.pow(2, yp-1));

    var tile_xmin = xi * Math.pow(2, xp-1);
    var tile_xmax = xi * Math.pow(2, xp-1) + Math.pow(2, xp);
    var tile_ymin = yi * Math.pow(2, yp-1);
    var tile_ymax = yi * Math.pow(2, yp-1) + Math.pow(2, yp);

    this.assert(tile_xmin <= xmin, "Tile xmin, " + tile_xmin + " not smaller than xmin, " + xmin);
    this.assert(tile_xmax >= xmax, "Tile xmax, " + tile_xmax + " not greater than xmax, " + xmax);
    this.assert(tile_ymin <= ymin, "Tile ymin, " + tile_ymin + " not smaller than ymin, " + ymin);
    this.assert(tile_ymax >= ymax, "Tile ymax, " + tile_ymax + " not greater than ymax, " + ymax);

    return [xi, xp, yi, yp, pixel_w, pixel_h];
  };

  // exponent of tile width and height, i.e. 2^(tile_power) = tile_size
  this.xp = null;
  this.yp = null;

  this.get_tile_to_fetch = function(options) {
    function get_tile_helper(tiles) {
      for (var k = 0; k < tiles.length; k++) {
        if (that.should_fetch_now(tiles[k])) { return tiles[k]; }
      }
      return null;
    }

    if (options.one_to_cover) {
      var tile = this.get_one_to_cover(this.xmin, this.xmax, this.ymin, this.ymax);
      if (this.should_fetch_now(tile)) { return [tile, false]; }
    } else {
      var tiles = this.get_tiles_of_size_to_cover(this.xmin, this.xmax, this.ymin, this.ymax);
      var tile = get_tile_helper(tiles);
      if (tile) {return [tile, false];}
    }

    var w = this.xmax - this.xmin;
    var h = this.ymax - this.ymin;

    var default_powers = this.get_default_powers();
    var xp = default_powers[0];
    var yp = default_powers[1];

    if (options.prefetch_pan) {
      // fetch the 8 adjacent windows
      var tiles = this.get_tiles_of_size_to_cover(
        this.xmin - w, this.xmax + w,
        this.ymin - h, this.ymax + h,
        xp, 0, yp, 0
      );

      var tile = get_tile_helper(tiles);
      if (tile) {return [tile, true];}
    }

    if (options.prefetch_zoom) {
      // zoom out
      var scale = 1;
      var tiles = this.get_tiles_of_size_to_cover(
        this.xmin - w, this.xmax + w,
        this.ymin - h, this.ymax + h,
        xp + scale, 0, yp + scale, 0, scale
      );
      var tile = get_tile_helper(tiles);
      if (tile) {return [tile, true];}

      // zoom in
      scale = -1;
      var tiles = this.get_tiles_of_size_to_cover(
        this.xmin - (w/2), this.xmax + (w/2),
        this.ymin - (h/2), this.ymax + (h/2),
        xp + scale, 0, yp + scale, 0, scale
      );
      var tile = get_tile_helper(tiles);
      if (tile) {return [tile, true];}

    }


    return [null, null];
    // return a task
  };

  this.try_draw_at_any_res = function(xmin, xmax, ymin, ymax) {
    // Draw this window, using tiles already cached, as best as we can
    // Needs to start at "top" level, in order for this to work with actual data.
    // If we want it to work with changing window limits, we'd have to


    var default_powers = this.get_default_powers();
    var levels_up = 2;
    var levels_down = 1;
    var xp = default_powers[0] + levels_up;
    var yp = default_powers[1] + levels_up;

    var tiles = this.get_tiles_of_size_to_cover(this.xmin, this.xmax, this.ymin, this.ymax, xp, 0, yp, 0, levels_up);
    for (var i = 0; i < tiles.length; i++) {
      this.try_draw_tile_at_any_res(tiles[i], levels_up + levels_down);
    }

  };

  this.try_draw_tile_at_any_res = function(tile, depth) {
    var drew = this.try_drawing_tile(tile);
    if (depth == 0) {return;}
    // tile = [xi, xp, yi, yp, w, h]
    // children:
    //    [xi * 2, xp-1, yi * 2, yp-1, w, h]
    var xi = tile[0];
    var xp = tile[1];
    var yi = tile[2];
    var yp = tile[3];
    var w = tile[4];
    var h = tile[5];
    //if (!drew) {  // wrong stopping condition for recursion
      this.try_draw_tile_at_any_res([  xi    * 2, xp-1,  yi    *2, yp-1, w, h], depth-1);
      this.try_draw_tile_at_any_res([  xi    * 2, xp-1, (yi+1) *2, yp-1, w, h], depth-1);
      this.try_draw_tile_at_any_res([ (xi+1) * 2, xp-1,  yi    *2, yp-1, w, h], depth-1);
      this.try_draw_tile_at_any_res([ (xi+1) * 2, xp-1, (yi+1) *2, yp-1, w, h], depth-1);
    //}
  }

  if (!this.options.children) {this.options.children = []};
    //console.log("CAN DRAW ALL?", this.options.local_plotting)
  if (this.options.local_plotting) {
    if (!this.options.children.length) {
      this.options.children = [this.options.children]; // sigh, octave json load
    }

    this.drawables = [];
    for (var k =0; k < this.options.children.length; k++) {
      var child = this.options.children[k];
      if (child.Type == 'line') {
        // child contains marker color, etc
        this.drawables.push(new LineDrawable(child.XData, child.YData, child));
      } else if (child.Type == 'text') {
        this.drawables.push(new TextDrawable(child));
      } else if (child.Type == 'patch') {
        this.drawables.push(new PatchDrawable(child));
      } else if (child.Type == 'image') {
        this.drawables.push(new MatImageDrawable(child));
      }
    }
  }

  var last_clear = null;
  var draw_callback = null;
  // function to be called upon the next tile drawn

  // TODO: cover with bad resolution
  this.redraw = function(options) {
    if (this.deleted)  {return;}

    this.resize(); // in case window changed size
    if ((this.canvas_w <= 0) || (this.canvas_h <= 0)) {
      console.log('canvas dimensions too small, not drawing', this.canvas_w, this.canvas_h);
      return;
    }

    var draw_cb = function() {
      //console.log('clearing axis')

      last_clear = Date.now()
      ctx.clearRect(0, 0, that.canvas_w, that.canvas_h);

      if (that.options.is_legend) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, that.canvas_w, that.canvas_h);
        ctx.fill();
      } else {
        that.redraw_axis_layer();
      }
    }

    //if (options.delay) {
      //console.log('delaying')
      draw_callback = draw_cb;
    //} else {
    //  draw_cb()
    //};

    if (this.options.ndims == 3) {
      tile_req_q.push({full_static: true});
      return;
    }

    if (this.options.local_plotting) {
      this.log("DRAWING RIGHT AWAY!")
      this.draw_items(this.drawables);
      return;
    }

    if (options.switch_view) { clearQueue(); }

    var one_to_cover = options.switch_view;
    tile_req_q.push({one_to_cover: one_to_cover});

    that.log("REDRAWING", one_to_cover);

    // use the wrong resolution, temporarily?
    // var bad_res = false;

    // Each relevant tile is in 1 of three states:
    //    1. already fetched, in which case we draw
    //    2. fetching, in which case we update it to draw upon return
    //    3. not fetched, in which case we will fetch it
    if (one_to_cover) {
      var tile = this.get_one_to_cover(this.xmin, this.xmax, this.ymin, this.ymax);
      this.update_fetch_style(tile);
      this.try_drawing_tile(tile);
    } else {
      this.try_draw_at_any_res(this.xmin, this.xmax, this.ymin, this.ymax);

      var tiles = this.get_tiles_of_size_to_cover(this.xmin, this.xmax, this.ymin, this.ymax);
      this.update_fetch_styles(tiles);
      this.try_drawing_tiles(tiles);

      }
  };

  $(event_canvas).dblclick(function(e){
    var shiftkey_held = e.shiftKey;
    var x = that.rx(e.pageX-$(event_canvas).offset().left);
    var y = that.ry(e.pageY-$(event_canvas).offset().top );
    if (that.mode == 'zoom_in') {
      var math_w = (that.xmax - that.xmin) / 2;
      var math_h = (that.ymax - that.ymin) / 2;
      that.xmax = x + (math_w / 2);
      that.xmin = x - (math_w / 2);
      that.ymax = y + (math_h / 2);
      that.ymin = y - (math_h / 2);
      that.update_transform();
      that.redraw({});
    } else if (that.mode == 'zoom_out')  {
      //that.log("ZOOMING OUT")
      //var x = that.rx(fx);
      //var y = that.ry(fy);
      //that.log(x, y)
      var math_w = (that.xmax - that.xmin);
      var math_h = (that.ymax - that.ymin);
      that.xmin = x - math_w;
      that.xmax = x + math_w;
      that.ymin = y - math_h;
      that.ymax = y + math_h;
      //that.log(that.xmax, that.xmin, that.ymax, that.ymin)
      that.update_transform();
      that.redraw({});
    }
  });

  // DRAG

  var mousestart_x = null; // starting coordinates of a mouse drag
  var mousestart_y = null;

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { // escape key
      select_rect_draw = null;
      $(event_canvas).off('mousemove');
      that.redraw_axis_layer();
    }
  });

  function get_event_offset(e) {
     var eoffsetX = (e.offsetX || e.clientX - $(e.target).offset().left + window.pageXOffset )
     var eoffsetY = (e.offsetY || e.clientY - $(e.target).offset().top + window.pageYOffset )
     return {X: eoffsetX, Y: eoffsetY};
  }

  function mousedown(e) {
    var offsets = get_event_offset(e);
    mousestart_x = offsets.X;
    mousestart_y = offsets.Y;
    var px = offsets.X;
    var py = offsets.Y;
    $(event_canvas).mousemove(function(e) {
      var offsets = get_event_offset(e);
      var dx = offsets.X-px;
      var dy = offsets.Y-py;
      px = offsets.X;
      py = offsets.Y;

      // dragged amount
      if (that.mode == 'pan') {
        drag(dx,dy);
        that.redraw({});
      } else if (that.mode == 'zoom_in') {
        // put rectangle indicating zooming

        var xmin = Math.min(that.rx(mousestart_x), that.rx(px));
        var xmax = Math.max(that.rx(mousestart_x), that.rx(px));
        var ymin = Math.min(that.ry(mousestart_y), that.ry(py));
        var ymax = Math.max(that.ry(mousestart_y), that.ry(py));

        select_rect_draw = new RectangleDrawable(xmin, ymin, xmax - xmin, ymax - ymin, {});
        that.redraw_axis_layer();
      }
    });
  }

  function mouseup(e) {
    if (mousestart_x === null) {return;}
    $(event_canvas).off('mousemove');
    var offsets = get_event_offset(e);
    var fx = offsets.X;
    var fy = offsets.Y;
    if (that.mode == 'zoom_in') {
      if (select_rect_draw !== null) { // escape was not pressed
        select_rect_draw = null;
        if ((mousestart_x != fx) && (mousestart_y != fy)) {
          that.xmin = Math.min(that.rx(mousestart_x), that.rx(fx));
          that.xmax = Math.max(that.rx(mousestart_x), that.rx(fx));
          that.ymin = Math.min(that.ry(mousestart_y), that.ry(fy));
          that.ymax = Math.max(that.ry(mousestart_y), that.ry(fy));
          that.update_transform();
          that.redraw({});
        }
      }
    } else if (that.mode == 'zoom_out') {
    }
    mousestart_x = null;
    mousestart_y = null;
  }

  $(event_canvas).mousedown(mousedown);
  $('body').mouseup(mouseup);

  this.zooming = null;

  this.redraw({switch_view: true});


  // TODO: is there a better way to do this?
  this.deleted = false;
  this._delete = function() {
    this.deleted = true;
  };

  return this;
}
