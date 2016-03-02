"use strict";

function get_surface_data_defaults(data) {
  data.n = data.zValues.length;
  data.m = data.zValues[0].length;

  if (! (("xValues" in data) && ("yValues" in data)) ) {
     var xVals = new Array();
     var yVals = new Array();
     for (var i = 0; i < data.n; i++){
         xVals[i] = new Array();
         yVals[i] = new Array();
         for (var j = 0; j < data.m; j++) {
           xVals[i][j] = i + 1;
           yVals[i][j] = j + 1;
         }
     }
     if (!("xValues" in data)) {
       data.xValues = xVals;
     }
     if (!("yValues" in data)) {
       data.yValues = yVals;
     }
  }

  if (! ("colors" in data)) {
    data.colors = data.zValues;
  }

  //if (! ("tooltips" in options)) {
    var tooltipStrings = new Array();
    for (var i = 0; i < data.n; i++)  {
      tooltipStrings[i] = new Array();
      for (var j = 0; j < data.m; j++) {
        tooltipStrings[i][j] = "x:" + data.xValues[i][j]
                          + ",\ny:" + data.yValues[i][j]
                          + ",\nz:" + data.zValues[i][j];
      }   
    }   
    data.tooltips = tooltipStrings;
  //}

  return data;
}

function get_scatter_data_defaults(data) {
  data.n = data.zValues.length;

  if (! ("sizes" in data)) {
    data.sizes = new Array();
    for (var i = 0; i < data.n; i++)  {
      data.sizes[i] = 5;
    }
  }

  if (! ("colors" in data)) {
    data.colors = new Array();
    for (var i = 0; i < data.n; i++)  {
      data.colors[i] = 1;
    }
  }

  //if (! ("filled" in options)) {
    data.filled = true;
  //}

  //if (! ("tooltips" in options)) {
    var tooltipStrings = new Array();
    for (var i = 0; i < data.n; i++)  {
        tooltipStrings[i] = "x:" + data.xValues[i]
                       + ",\ny:" + data.yValues[i]
                       + ",\nz:" + data.zValues[i];
    }
    data.tooltips = tooltipStrings;
  //}

  return data;
}

var colour1 = {red:0, green:0, blue:255};
var colour2 = {red:0, green:255, blue:255};
var colour3 = {red:0, green:255, blue:0};
var colour4 = {red:255, green:255, blue:0};
var colour5 = {red:255, green:0, blue:0};
var default_colours = [colour1, colour2, colour3, colour4, colour5];

function get_surface_plot(element) {
  var options = {};

  // Axis labels.
  options.xTitle = "X";
  options.yTitle = "Y";
  options.zTitle = "Z";
  //options.xTicks = [0, 5, 10, 20];
  //options.yTicks = [-0.4, 0, 0.4, 30];
  //options.zTicks = [-100, 1000, 0];
  options.backColour = '#ffffff';
  options.axisTextColour = '#000000'; // Color of axis stuff

  return new SurfacePlot(element, options);
  //return new GLSurfacePlot(element, options);
}
      
// data has the following fields:
//  - zValues:  required
//  - xValues, yValues:  specify x and y coordinates.  Default to mesh([1, ... , n], [1, ... , m])
//  - Colors:  defaults to using normalized z values

function surf(surface_plot, data) {
  var options = {}
  options.fill = true;
  options.colourGradient = default_colours;
  data = get_surface_data_defaults(data);
  data.options = options;
  return surface_plot.add_surface_data(data)
}

function mesh(surface_plot, data) {
  var options = {}
  options.fill = false
  options.colourGradient = default_colours;
  data = get_surface_data_defaults(data);
  data.options = options;
  return surface_plot.add_surface_data(data)
}

function scatter3(surface_plot, data) {
  var options = {}
  options.colourGradient = default_colours;
  data = get_scatter_data_defaults(data);
  data.options = options;

  return surface_plot.add_scatter_data(data)
}
