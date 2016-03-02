///////////////////////////////////////////////////////////////////////////////
// RENDERING
///////////////////////////////////////////////////////////////////////////////

CanvasRender = {}

CanvasRender.RootRender = function(div, options) {
  var cur_figure = this.GetCurrentFigure();
  cur_figure.Render(div, options);
}
GraphicsObjects.RootNode.prototype.Render = CanvasRender.RootRender;

CanvasRender.FigureRender = function(div, options) {
  // NOTE: options are ignored
  // TODO: should loop through and make subplots
  for (var h in this.children) {
    var child = this.children[h];
    child.Render(div, options);
  }
  //var cur_axes = this.GetCurrentAxes();
  //cur_axes.Render(div, options);
}
GraphicsObjects.FigureNode.prototype.Render = CanvasRender.FigureRender;

CanvasRender.AxesRender = function(figure_div, options) {
  var position = this.properties.Position;

  var left = position[0]; 
  var bottom = position[1]; 
  var width = position[2]; 
  var height = position[3]; 
  var top = 1 - bottom - height;

  var my_div = $('<div></div>');

  my_div.css('position', 'absolute');
  //my_div.css('left', (left * figure_div.width()) + 'px');
  //my_div.css('top', (top * figure_div.height()) + 'px');
  ////// THIS DOESNT WORK WHEN PANES RESIZE...
  //my_div.css('width', (width * figure_div.width()) + 'px');
  //my_div.css('height', (height * figure_div.height()) + 'px');
  
  my_div.css('left', (left*100) + '%');
  my_div.css('top',  (top*100)+ '%');
  my_div.css('right',  'auto'); 
  my_div.css('bottom', 'auto');
  my_div.css('width', (width * 100) + '%');
  my_div.css('height', (height * 100) + '%');
  //my_div.css('right', ((1-(left+width))*100) + '%');
  //my_div.css('bottom', ((1-(top+height))*100) + '%');
  //// THIS DOESNT WORK WHEN PANES RESIZE...
  //my_div.css('width', 'auto' );
  //my_div.css('height', 'auto');

  // THIS DOESNT WORK IN NEWEST CHROME...
  //my_div.css('margin-left', (100 * col / n) + '%');
  //my_div.css('margin-top', (100 * row / m ) + '%');
  // THIS DOESNT WORK IF DIV IS HIDDEN? (FOR CAROUSEL)
  //my_div.css('width', (100  / n) + '%');
  //my_div.css('height', (100  / m ) + '%');
  // draw a circle in the center of the canvas

  figure_div.append(my_div);

  var title_div = $('<div class="title_div"></div>');
  title_div.css('text-align', 'center');
  my_div.append(title_div);
  title_div.html('Title');

  var plot_div = $('<div class="plot_div"></div>');
  plot_div.css('margin-bottom', title_div.height());
  plot_div.css('margin-left', 'auto');
  plot_div.css('margin-right', 'auto');
  plot_div.css('height', '100%'); // TODO: fix this when enabling title
  my_div.append(plot_div);

  // TODO: separate into separate initialization function
  var canvas = document.createElement('canvas');
  plot_div.append(canvas)
  var ctx = canvas.getContext('2d');
  canvas.style.border = 0;
  var w = canvas.width = plot_div.width(); // = canvas.clientWidth
  var h = canvas.height = plot_div.height(); // = canvas.clientHeight

  // Get the limits
  if (this.properties.XLimMode == 'auto') {
    var xmin = this.xmin;
    var xmax = this.xmax;
  } else {
    var xmin = this.properties.XLim[0];
    var xmax = this.properties.XLim[1];
  }

  if (this.properties.YLimMode == 'auto') {
    var ymin = this.ymin;
    var ymax = this.ymax;
  } else {
    var ymin = this.properties.YLim[0];
    var ymax = this.properties.YLim[1];
  }
  console.log(xmin, xmax, ymin, ymax)

  var sx = w/(xmax-xmin), ox = -sx*xmin;
  var sy = h/(ymin-ymax), oy = -sy*ymax;
  function tx(x) { return sx*x+ox; }
  function ty(y) { return sy*y+oy; }

  for (i in this.children) {
    this.children[i].Render(ctx, tx, ty);
  }
}
GraphicsObjects.AxesNode.prototype.Render = CanvasRender.AxesRender;

CanvasRender.LineRender = function(ctx, tx, ty) {
  // TODO: color, linestyle, marker, etc
  
  var x = this.properties.XData;
  var y = this.properties.YData;

  ctx.strokeStyle = 'rgb(' + this.properties.Color.join(',') + ')';
  ctx.lineWidth = this.properties.LineWidth; // TODO: convert to pixels
  ctx.beginPath();
  ctx.moveTo(tx(x[0]), ty(y[0]));
  for(var i=1; i<x.length; ++i){
    ctx.lineTo(tx(x[i]),ty(y[i]));
  }
  ctx.stroke();
  ctx.closePath();
}

GraphicsObjects.LineNode.prototype.Render = CanvasRender.LineRender;

CanvasRender.PatchRender = function(ctx, tx, ty) {
  // TODO: color, linestyle, marker, etc
  var x = this.properties.XData;
  var y = this.properties.YData;

  ctx.fillStyle = 'rgb(' + this.properties.CData.join(',') + ')';
  ctx.strokeStyle = 'rgb(' + this.properties.EdgeColor.join(',') + ')';
  ctx.lineWidth = this.properties.LineWidth; // TODO: convert to pixels.   patch covers half of it
  ctx.beginPath();
  ctx.moveTo(tx(x[0]), ty(y[0]));
  for(var i=1; i<x.length; ++i){
    ctx.lineTo(tx(x[i]),ty(y[i]));
  }
  ctx.lineTo(tx(x[0]), ty(y[0]));
  ctx.fill();
  if (x.length > 0) {ctx.lineTo(tx(x[1]), ty(y[1]));} // to make the corner look good
  ctx.stroke();
  ctx.closePath();
}

GraphicsObjects.PatchNode.prototype.Render = CanvasRender.PatchRender;

