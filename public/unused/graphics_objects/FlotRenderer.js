///////////////////////////////////////////////////////////////////////////////
// UTILITIES
///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////
// RENDERING
///////////////////////////////////////////////////////////////////////////////

FlotRender = {}

FlotRender.RootRender = function(div, options) {
  var cur_figure = this.GetCurrentFigure();
  cur_figure.Render(div, options);
}
GraphicsObjects.RootNode.prototype.Render = FlotRender.RootRender;

FlotRender.FigureRender = function(div, options) {
  // NOTE: options are ignored
  // TODO: should loop through and make subplots
  for (var h in this.children) {
    var child = this.children[h];
    child.Render(div, options);
  }
  //var cur_axes = this.GetCurrentAxes();
  //cur_axes.Render(div, options);
}
GraphicsObjects.FigureNode.prototype.Render = FlotRender.FigureRender;

FlotRender.AxesRender = function(figure_div, options) {
  var position = this.properties.Position;

  var left = position[0]; 
  var bottom = position[1]; 
  var width = position[2]; 
  var height = position[3]; 
  var top = 1 - bottom - width;

  var my_div = $('<div></div>');

  my_div.css('position', 'absolute');
  //my_div.css('left', (left * figure_div.width()) + 'px');
  //my_div.css('top', (top * figure_div.height()) + 'px');
  ////// THIS DOESNT WORK WHEN PANES RESIZE...
  //my_div.css('width', (width * figure_div.width()) + 'px');
  //my_div.css('height', (height * figure_div.height()) + 'px');
  
  console.log(left, top, width, height);

  my_div.css('left', (left*100) + '%');
  my_div.css('top',  (top*100)+ '%');
  my_div.css('right',  'auto'); 
  my_div.css('bottom', 'auto');
  my_div.css('width', (width * 100) + '%');
  my_div.css('height', (height * 100) + '%');
  //my_div.css('right', ((1-(left+width))*100) + '%');
  //my_div.css('bottom', ((1-(top+height))*100) + '%');
  //// THIS DOESNT WORK WHEN PANES RESIZE...
  //my_div.css('width', 'auto');
  //my_div.css('height', 'auto');

  // THIS DOESNT WORK IN NEWEST CHROME...
  //my_div.css('margin-left', (100 * col / n) + '%');
  //my_div.css('margin-top', (100 * row / m ) + '%');
  // THIS DOESNT WORK IF DIV IS HIDDEN? (FOR CAROUSEL)
  //my_div.css('width', (100  / n) + '%');
  //my_div.css('height', (100  / m ) + '%');

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


  var plot_state = {};
  clear_plot_state(plot_state)

  for (i in this.children) {
    this.children[i].Render(plot_div, plot_state);
  }
  var plot = $.plot(plot_div, plot_state.series, plot_state.options);
}
GraphicsObjects.AxesNode.prototype.Render = FlotRender.AxesRender;

FlotRender.LineRender = function(div, plot_state) {
  var data = [];
  for (var i in this.properties.XData) {
    var x = this.properties.XData[i];
    var y = this.properties.YData[i];
    data.push([x, y]);
  }

  var line_options = {
    show:true, 
    lineWidth:1
  }

  var series = { data   : data ,
                 images : {show:false},
                 lines : line_options
               };

  plot_state.series.push(series)
}

GraphicsObjects.LineNode.prototype.Render = FlotRender.LineRender;

FlotRender.PatchRender = function(div, plot_state) {
  // TODO
}

GraphicsObjects.PatchNode.prototype.Render = FlotRender.PatchRender;

