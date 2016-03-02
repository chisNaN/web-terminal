"use strict";

var sort = function(array) {
    var len = array.length;
    if(len < 2) { return array; }
    var pivot = Math.ceil(len/2);
    return merge(sort(array.slice(0,pivot)), sort(array.slice(pivot)));
};

var merge = function(left, right) {
    var result = [];
    var li = 0;
    var ri = 0;
    while((li < left.length) && (ri < right.length)) {
        if(left[li].distanceFromCamera < right[ri].distanceFromCamera) {
            result.push(left[li]);
            li++;
        } else {
            result.push(right[ri]);
            ri++;
        }
    }
    return result.concat(left, right);
};

/*
 * SurfacePlot.js
 *
 * Written by Greg Ross
 *
 * Copyright 2012 ngmoco, LLC.  Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of 
 * the License at http://www.apache.org/licenses/LICENSE-2.0.  Unless required by applicable 
 * law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
 * See the License for the specific language governing permissions and limitations under the 
 * License.
 *
 */

var SurfacePlot = function(element, options) {
    var DEFAULT_X_ANGLE   = 45;
    var DEFAULT_Z_ANGLE   = 45;

    var targetElement = element;

    this.backColour = options.backColour;
    this.axisTextColour = options.axisTextColour;

    var origin = options.origin;
    var startXAngle = options.startXAngle;
    var startZAngle = options.startZAngle;

    var self = this; 

    this.renderer = null;

    this.minXValue = Number.MAX_VALUE;
    this.maxXValue = -Number.MAX_VALUE;
    this.minYValue = Number.MAX_VALUE;
    this.maxYValue = -Number.MAX_VALUE;
    this.minZValue = Number.MAX_VALUE;
    this.maxZValue = -Number.MAX_VALUE;

    this.xTitle = options.xTitle;
    this.yTitle = options.yTitle;
    this.zTitle = options.zTitle;

    this.xTicks = options.xTicks;
    this.yTicks = options.yTicks;
    this.zTicks = options.zTicks;

    this.tickLength = 0.05
    this.gridOn = options.grid
    this.ticksOn = true

    var canvas;
    var canvasContext = null;
    this.context2D = null;

    var scale;
    var currentXAngle;
    var currentZAngle;

    var transformation;

    this.reset = function() {
      scale = 1;
      // TODO: ADD 3d "view" command, using OPTIONs
      currentXAngle = DEFAULT_X_ANGLE;
      currentZAngle = DEFAULT_Z_ANGLE;
    }

    this.reset();
    
    if (startXAngle != null && startXAngle != void 0)
        currentXAngle = startXAngle;
    
    if (startZAngle != null && startZAngle != void 0)
        currentZAngle = startZAngle;
        
    this.surfaces_data = new Array();
    this.scatters_data = new Array();
    var surfaces_points = new Array();
    var plot_points = new Array();
    var displayValues = null;
    var cameraPosition;
    
    var mouseDown1 = false;
    var mousePosX = null;
    var mousePosY = null;
    var lastMousePos = new Point(0, 0);
    var mouseButton1Up = null;
    var mouseButton1Down = new Point(0, 0);
    var wheeldelta = 0;
    var closestXToMouse = null;
    var closestYToMouse = null;
    var closestSurfaceToMouse = null;
    var tTip = new Tooltip(false, options.tooltipColour);
    
	  function getInternetExplorerVersion() { // Returns the version of Internet Explorer or a -1
                                            // (indicating the use of another browser).
        var rv = -1; // Return value assumes failure.
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)  {rv = parseFloat(RegExp.$1);}
        }
        return rv;
    }
    
    function supports_canvas() {
         return (!!document.createElement('canvas').getContext);
    }
    
    this.update_limits = function(x, y, z) {
      if (x < this.minXValue) this.minXValue = x;
      if (x > this.maxXValue) this.maxXValue = x;
      if (y < this.minYValue) this.minYValue = y;
      if (y > this.maxYValue) this.maxYValue = y;
      if (z < this.minZValue) this.minZValue = z;
      if (z > this.maxZValue) this.maxZValue = z;
    }

    this.update_structure_limits = function(structure, x, y, z, c) {
      this.update_limits(x, y, z);
      if (z < structure.minZ) structure.minZ = z;
      if (z > structure.maxZ) structure.maxZ = z;
      if (c < structure.minC) structure.minC = c;
      if (c > structure.maxC) structure.maxC = c;
    }

    this.add_surface_data = function(surface_data) {
      this.surfaces_data[this.surfaces_data.length] = surface_data;

      surface_data.n = surface_data.zValues.length;
      surface_data.m = surface_data.zValues[0].length;

      // Prepare the data
    	surface_data.minZ = Number.MAX_VALUE;
      surface_data.maxZ = -Number.MAX_VALUE;
    	surface_data.minC = Number.MAX_VALUE;
      surface_data.maxC = -Number.MAX_VALUE;

      for (var i = 0; i < surface_data.n; i++) {
        for (var j = 0; j < surface_data.m; j++) {
          var x = surface_data.xValues[i][j];
          var y = surface_data.yValues[i][j];
          var z = surface_data.zValues[i][j];
          var c = surface_data.colors[i][j];
          
          this.update_structure_limits(surface_data, x, y, z, c)
        }
      }

      this.recalculateTicks();

      surfaces_points = new Array();
      for (var k = 0; k < this.surfaces_data.length; k++) {
          var surface_data = this.surfaces_data[k];
          var color_gradient = new ColourGradient(surface_data.minC, surface_data.maxC, surface_data.options.colourGradient);
          var numPoints = surface_data.n * surface_data.m;
          var surface_points = new Array();
          for (var i = 0; i < surface_data.n; i++) {
              var surface_points_row = new Array();
              for (var j = 0; j < surface_data.m; j++) {
                  var x = this.scale_to(surface_data.xValues[i][j], this.minXValue, this.maxXValue);
                  var y = this.scale_to(surface_data.yValues[i][j], this.minYValue, this.maxYValue);
                  var z = this.scale_to(surface_data.zValues[i][j], this.minZValue, this.maxZValue);
                  if (surface_data.colors) {
                    var color = color_gradient.getColour(surface_data.colors[i][j]);
                  } else {
                    var color = color_gradient.getColour(z);
                  }
                  surface_points_row[surface_points_row.length] = new Point3D(x, y, z, color);
              }
              surface_points[surface_points.length] = surface_points_row;
          }
          surface_points.fill = surface_data.options.fill;
          surfaces_points[surfaces_points.length] = surface_points;
      }

      this.render();
      return this.surfaces_data.length - 1;
    }

    this.add_scatter_data = function(scatter_data) {
      this.scatters_data[this.scatters_data.length] = scatter_data;

  	  scatter_data.minZ = Number.MAX_VALUE;
      scatter_data.maxZ = -Number.MAX_VALUE;
    	scatter_data.minC = Number.MAX_VALUE;
      scatter_data.maxC = -Number.MAX_VALUE;

      for (var i = 0; i < scatter_data.zValues.length; i++) {
        var x = scatter_data.xValues[i];
        var y = scatter_data.yValues[i];
        var z = scatter_data.zValues[i];
        var c = scatter_data.colors[i];
        
        this.update_structure_limits(scatter_data, x, y, z, c)
      }

      this.recalculateTicks();

      plot_points = new Array();
      for (var k = 0; k < this.scatters_data.length; k++) {
          var scatter_data = this.scatters_data[k];
          var color_gradient = new ColourGradient(scatter_data.minC, scatter_data.maxC, scatter_data.options.colourGradient);
          for (var i = 0; i < scatter_data.zValues.length; i++) {
              var x = this.scale_to(scatter_data.xValues[i], this.minXValue, this.maxXValue);
              var y = this.scale_to(scatter_data.yValues[i], this.minYValue, this.maxYValue);
              var z = this.scale_to(scatter_data.zValues[i], this.minZValue, this.maxZValue);
              if (scatter_data.colors) {
                var color = color_gradient.getColour(scatter_data.colors[i]);
              } else {
                var color = color_gradient.getColour(z);
              }
              var size = scatter_data.sizes[i];
              plot_points.push(new Point3D(x, y, z, color, size));
          }
      }

      this.render();
      return this.scatters_data.length - 1;
    }

    this.recalculateTicks = function() {
      if (this.xTicks == undefined)  { this.xTicks = this.calculateTicks(this.minXValue, this.maxXValue);}
      if (this.yTicks == undefined)  { this.yTicks = this.calculateTicks(this.minYValue, this.maxYValue);}
      if (this.zTicks == undefined)  { this.zTicks = this.calculateTicks(this.minZValue, this.maxZValue);}

      for (var i = 0; i < this.xTicks.length; i++) {
        var x = this.xTicks[i];
        if (x < this.minXValue) this.minXValue = x;
        if (x > this.maxXValue) this.maxXValue = x;
      }
      for (var i = 0; i < this.yTicks.length; i++) {
        var y = this.yTicks[i];
        if (y < this.minYValue) this.minYValue = y;
        if (y > this.maxYValue) this.maxYValue = y;
      }
      for (var i = 0; i < this.zTicks.length; i++) {
        var z = this.zTicks[i];
        if (z < this.minZValue) this.minZValue = z;
        if (z > this.maxZValue) this.maxZValue = z;
      }
    }
    
    this.cleanUp = function() {
    	canvas.onmousedown = null;
  		canvas.onmouseup = null;
  		anvas.onmousemove = null;
      canvas.onmousewheel = null;
		
      canvasContext = null;
      this.surfaces_data = null;
      this.scatters_data = null;
    }
    
    function hideTooltip() {
        tTip.hide();
    }
    
    function displayTooltip(e) {
        var position = new Point(e.x, e.y);
        var ttip = self.surfaces_data[closestSurfaceToMouse].tooltips[closestXToMouse][closestYToMouse]
        tTip.show(ttip, 200);
    }
    
    this.render = function() {
        this.renderer.setXAngle(currentXAngle);
        this.renderer.setZAngle(currentZAngle);
        this.renderer.setScale(scale);

        transformation = new Th3dtran();
        transformation.init();
        transformation.rotate(currentXAngle, 0.0, currentZAngle);
        transformation.scale(scale);
        
        cameraPosition = new Point3D(0, 0, -1000.0);
        
        var yzFaceCenterPoint = transformation.transformPoint(new Point3D(-0.5, 0, 0));
        var xzFaceCenterPoint = transformation.transformPoint(new Point3D(0, 0.5, 0));
        var xyFaceCenterPoint = transformation.transformPoint(new Point3D(0, 0, -0.5));
  
        var yzOppositePoint = transformation.transformPoint(new Point3D(0.5, 0, 0));
        var xzOppositePoint = transformation.transformPoint(new Point3D(0, -0.5, 0));
        var xyOppositePoint = transformation.transformPoint(new Point3D(0, 0, 0.5));
  

        this.showX = ((euclidian_distance(cameraPosition, xzFaceCenterPoint) > euclidian_distance(cameraPosition, xzOppositePoint)) ||
            (euclidian_distance(cameraPosition, xyFaceCenterPoint) > euclidian_distance(cameraPosition, xyOppositePoint)))
  
        this.showY = ((euclidian_distance(cameraPosition, xyFaceCenterPoint) > euclidian_distance(cameraPosition, xyOppositePoint)) ||
            (euclidian_distance(cameraPosition, yzFaceCenterPoint) > euclidian_distance(cameraPosition, yzOppositePoint)))
  
        this.showZ = ((euclidian_distance(cameraPosition, xzFaceCenterPoint) > euclidian_distance(cameraPosition, xzOppositePoint)) ||
            (euclidian_distance(cameraPosition, yzFaceCenterPoint) > euclidian_distance(cameraPosition, yzOppositePoint)))
  
        var polygons = new Array();

        for (var k = 0; k < surfaces_points.length; k++) {
          var surface_polygons = this.createSurfacePolygons(k);

          for (var i = 0; i < surface_polygons.length; i++)
            polygons[polygons.length] = surface_polygons[i];
        }

        var axes = this.createAxes();
        for (var i = 0; i < axes.length; i++) {
          polygons[polygons.length] = axes[i];
        }

        if (this.gridOn) {
          var grid = this.createGrid();
          for (var i = 0; i < grid.length; i++)
            polygons[polygons.length] = grid[i];
        }

        if (this.ticksOn) {
          var ticks = this.createTicks();
          for (var i = 0; i < ticks.length; i++)
            polygons[polygons.length] = ticks[i];
        }

        // TODO: needs to clear the axis text each time, since whether we show stuff changes
        // But then, need to redo all plot_points??
        // should probably add text separately
        //this.addAxisText();

        this.renderer.set_points(plot_points);
        this.renderer.set_polygons(polygons);

        this.renderer.render();

        //if (supports_canvas())
    };
    

    // Draw axis labels
    this.addAxisText = function() {
        var axisshift = 0.1
        var labelshift = this.tickLength + 0.05;

        var xLabelPoint = new Point3D(0.5 + axisshift, 0.5, -0.5);
        var yLabelPoint = new Point3D(-0.5, -0.5 - axisshift, -0.5);
        var zLabelPoint = new Point3D(-0.5, 0.5, 0.5 + axisshift);

        var axisfont = 'bold 18px sans-serif'
        var labelfont = '12px sans-serif'

        // TODO: rid of this
        this.axisTextColour = {red: 0, blue: 0, green: 0};

        if (this.showX) {
            plot_points.push(new Point3D(xLabelPoint.ax, xLabelPoint.ay, xLabelPoint.az, this.axisTextColour, 0, this.xTitle, axisfont));
 
            if (this.ticksOn) {
              var mindiff = 1;
              for (var i = 1; i < this.xTicks.length; i+= 1) {
                mindiff = Math.min(mindiff, this.xTicks[i] - this.xTicks[i-1]);
              }
              var digits = Math.ceil(- Math.log(mindiff) / Math.log(10));

              for (var i = 0; i < this.xTicks.length; i+= 1) {
                var val = this.xTicks[i].toFixed(digits);
                var x = this.scale_to(val, this.minXValue, this.maxXValue);
                plot_points.push(new Point3D(x, 0.5 + labelshift, -0.5, this.axisTextColour, 0, val, labelfont));
              }
            }
        }
        
        if (this.showY) {
            plot_points.push(new Point3D(yLabelPoint.ax, yLabelPoint.ay, yLabelPoint.az, this.axisTextColour, 0, this.yTitle, axisfont));

            if (this.ticksOn) {
              var mindiff = 1;
              for (var i = 1; i < this.yTicks.length; i+= 1) {
                mindiff = Math.min(mindiff, this.yTicks[i] - this.yTicks[i-1]);
              }
              var digits = Math.ceil(- Math.log(mindiff) / Math.log(10));

              for (var i = 0; i < this.yTicks.length; i+= 1) {
                var val = this.yTicks[i].toFixed(digits);
                var y = this.scale_to(val, this.minYValue, this.maxYValue);
                plot_points.push(new Point3D(-0.5 - labelshift, y, -0.5, this.axisTextColour, 0, val, labelfont));
              }
            }
        }
        
        if (this.showZ) {
            plot_points.push(new Point3D(zLabelPoint.ax, zLabelPoint.ay, zLabelPoint.az, this.axisTextColour, 0, this.zTitle, axisfont));

            if (this.ticksOn) {
              var mindiff = 1;
              for (var i = 1; i < this.zTicks.length; i+= 1) {
                mindiff = Math.min(mindiff, this.zTicks[i] - this.zTicks[i-1]);
              }
              var digits = Math.ceil(- Math.log(mindiff) / Math.log(10));

              var digits = Math.round(- Math.log(mindiff) / Math.log(10)) + 1;
              for (var i = 0; i < this.zTicks.length; i+= 1) {
                var val = this.zTicks[i].toFixed(digits);
                var z = this.scale_to(val, this.minZValue, this.maxZValue);
                plot_points.push(new Point3D(-0.5 - labelshift, 0.5 + labelshift, z, this.axisTextcolour, 0, val, labelfont));
              }
            }
        }
    };
    
    this.createAxes = function()
    {
        var axisOrigin = transformation.transformPoint(new Point3D(-0.5, 0.5, -0.5));
        var xAxisEndPoint = transformation.transformPoint(new Point3D(0.5, 0.5, -0.5));
        var yAxisEndPoint = transformation.transformPoint(new Point3D(-0.5, -0.5, -0.5));
        var zAxisEndPoint = transformation.transformPoint(new Point3D(-0.5, 0.5, 0.5));

        var axes = new Array();

        var xAxis = new Polygon(cameraPosition, "axis");
        xAxis.addPoint(axisOrigin);
        xAxis.addPoint(xAxisEndPoint);
        xAxis.done()
        axes[axes.length] = xAxis;

        var yAxis = new Polygon(cameraPosition, "axis");
        yAxis.addPoint(axisOrigin);
        yAxis.addPoint(yAxisEndPoint);
        yAxis.done()
        axes[axes.length] = yAxis;

        var zAxis = new Polygon(cameraPosition, "axis");
        zAxis.addPoint(axisOrigin);
        zAxis.addPoint(zAxisEndPoint);
        zAxis.done()
        axes[axes.length] = zAxis;
        
        return axes;
    };
    
    this.createTicks = function()
    {
        this.recalculateTicks();
        var ticks = new Array();

        if (this.showX) {
          for (var xi = 0; xi < this.xTicks.length; xi ++) {
            var x = this.scale_to(this.xTicks[xi], this.minXValue, this.maxXValue)
            var line = new Polygon(cameraPosition, "tick");
            line.addPoint(transformation.transformPoint(new Point3D(x, 0.5, -0.5)));
            line.addPoint(transformation.transformPoint(new Point3D(x, 0.5 + this.tickLength, -0.5)));
            line.done()
            ticks[ticks.length] = line;
          }
        }

        if (this.showY) {
          for (var yi = 0; yi < this.yTicks.length; yi ++) {
            var y = this.scale_to(this.yTicks[yi], this.minYValue, this.maxYValue)
            var line = new Polygon(cameraPosition, "tick");
            line.addPoint(transformation.transformPoint(new Point3D(-0.5, y, -0.5)));
            line.addPoint(transformation.transformPoint(new Point3D(-0.5 - this.tickLength, y, -0.5)));
            line.done()
            ticks[ticks.length] = line;
          }
        }

        if (this.showZ) {
          for (var zi = 0; zi < this.zTicks.length; zi ++) {
            var z = this.scale_to(this.zTicks[zi], this.minZValue, this.maxZValue)
            var line = new Polygon(cameraPosition, "tick");
            line.addPoint(transformation.transformPoint(new Point3D(-0.5, 0.5, z)));
            line.addPoint(transformation.transformPoint(new Point3D(-0.5 - this.tickLength, 0.5 + this.tickLength, z)));
            line.done()
            ticks[ticks.length] = line;
          }
        }

        return ticks
    }
        
    this.createGrid = function()
    {
        var gridlines = new Array();

        for (var yi = 0; yi < this.yTicks.length; yi ++) {
          for (var zi = 0; zi < this.zTicks.length; zi ++) {
            var y = this.scale_to(this.yTicks[yi], this.minYValue, this.maxYValue)
            var z = this.scale_to(this.zTicks[zi], this.minZValue, this.maxZValue)
            var line = new Polygon(cameraPosition, "grid");
            line.addPoint(transformation.transformPoint(new Point3D(-0.5, y, z)));
            line.addPoint(transformation.transformPoint(new Point3D(0.5, y, z)));
            line.done()
            gridlines[gridlines.length] = line;
          }
        }
        
        for (var xi = 0; xi < this.xTicks.length; xi ++) {
          for (var zi = 0; zi < this.zTicks.length; zi ++) {
            var x = this.scale_to(this.xTicks[xi], this.minXValue, this.maxXValue)
            var z = this.scale_to(this.zTicks[zi], this.minZValue, this.maxZValue)
            var line = new Polygon(cameraPosition, "grid");
            line.addPoint(transformation.transformPoint(new Point3D(x, -0.5, z)));
            line.addPoint(transformation.transformPoint(new Point3D(x, 0.5, z)));
            line.done()
            gridlines[gridlines.length] = line;
          }
        }
        
        for (var xi = 0; xi < this.xTicks.length; xi ++) {
          for (var yi = 0; yi < this.yTicks.length; yi ++) {
            var x = this.scale_to(this.xTicks[xi], this.minXValue, this.maxXValue)
            var y = this.scale_to(this.yTicks[yi], this.minYValue, this.maxYValue)
            var line = new Polygon(cameraPosition, "grid");
            line.addPoint(transformation.transformPoint(new Point3D(x, y, -0.5)));
            line.addPoint(transformation.transformPoint(new Point3D(x, y, 0.5)));
            line.done()
            gridlines[gridlines.length] = line;
          }
        }
        
        return gridlines;
    };
    
    this.createSurfacePolygons = function(k)
    {
        var surface_points = surfaces_points[k];
        var polygons = new Array();
        var n = surface_points.length
        var m = surface_points[0].length
        var fill = this.surfaces_data[k].options.fill;
        for (var i = 0; i < n - 1; i++)
        {
            for (var j = 0; j < m-1; j++)
            {
                var polygon = new Polygon(cameraPosition, "data", k, fill);
                
                polygon.addPoint(transformation.transformPoint(surface_points[i][j]));
                polygon.addPoint(transformation.transformPoint(surface_points[i+1][j]));
                polygon.addPoint(transformation.transformPoint(surface_points[i+1][j+1]));
                polygon.addPoint(transformation.transformPoint(surface_points[i][j+1]));
                polygon.done()

                polygons[polygons.length] = polygon;
            }
        }
        return polygons;
    };
    
    this.draw = function() {
      // ARGH.  THIS IS ONLY NEEDED BECAUSE OF SOMETHING HAPPENING OUTSIDE...
      canvas.setAttribute("width", $(targetElement).width());
      canvas.setAttribute("height", $(targetElement).height());
      targetElement.appendChild(canvas);
      this.render();
    }

    this.scale_to = function(x, min, max, scaled_min, scaled_max) {
      if (scaled_min == undefined) scaled_min = -0.5;
      if (scaled_max == undefined) scaled_max = 0.5;
      var a = (scaled_max - scaled_min) / (max - min + 0.0)
      var b = scaled_max - a * max
      return a * x + b
    }

  	this.nice_num = function(x, rounddown) {
      if (x == 0) {
        return 0;
      } else if (x < 0) {
        return - this.nice_num(-x, !rounddown)
      }

	  	var exp = Math.floor(Math.log(x) / Math.log(10));
	  	var f = x/Math.pow(10, exp);
	  	var nf;
  	
	  	if (rounddown)
	  	{
        if (f >= 10)	nf = 10;
        else if (f >= 5)	nf = 5;
        else if (f >= 2)	nf = 2;
        else nf = 1;
	  	}	else {
        if (f <= 1)	nf = 1;
        else if (f <= 2)	nf = 2;
        else if (f <= 5)	nf = 5;
        else nf = 10;
	  	}
	  	
	  	return nf * Math.pow(10, exp);
	}
    
    this.calculateTicks = function(min, max)
    {
      	// Automatically generate ticks, given a min and max value.
        if (max == min) {var width = 1; min = min - 0.5; max = max + 0.5;}
        else {var width = (max - min) / 2;}
        var tickwidth = this.nice_num(width, true);
      	var tick = tickwidth * Math.floor( min / tickwidth);
		    var ticks = [];
		    
		    while (tick < max)
		    {
		    	ticks.push(tick);
          tick += tickwidth;
		    }
		    ticks.push(tick);

        return ticks
    }
    
    this.init = function() {
        canvas = document.createElement("canvas");
        
        if (!supports_canvas()) {
            G_vmlCanvasManager.initElement(canvas);
        }

        canvas.setAttribute("width", $(targetElement).width());
        canvas.setAttribute("height", $(targetElement).height());
        canvas.style.left = '0px';
        canvas.style.top =  '0px';
        
        //try {
        //    canvasContext = canvas.getContext("experimental-webgl", { alpha: false });

        //    canvasContext.viewportWidth = canvas.width;
        //    canvasContext.viewportHeight = canvas.height;
        //    this.renderer = new GLRenderer(canvas, canvasContext, {});
        //
        //    //canUseWebGL = this.isWebGlEnabled();

        //    //var self = this;
        //    //var handleMouseDown = function(event) {
        //    //            mouseDown = true;
        //    //            lastMouseX = event.clientX;
        //    //            lastMouseY = event.clientY;
        //    //            
        //    //            document.onmouseup = self.handleMouseUp;
        //    //            document.onmousemove = self.handleMouseMove;
        //    //};
        //    //canvas.onmousedown = handleMouseDown;
        //    //document.onmouseup = this.handleMouseUp;
        //    //document.onmousemove = this.handleMouseMove;
    
        //} catch (e) {
            canvasContext = canvas.getContext("2d");
            canvasContext.font = "bold 18px sans-serif";
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            this.renderer = new CanvasRenderer(canvas, canvasContext, {});
        //}
        
        this.renderer.setBackColour(this.backColour);

        canvas.owner = this;
        canvas.onmousemove = this.mouseIsMoving;
        canvas.onmouseout = hideTooltip;
        canvas.onmousedown = this.mouseDownd;
        canvas.onmouseup = this.mouseUpd;
        canvas.onmousewheel = this.mouseWheel;

        targetElement.appendChild(canvas);
    };
    
    this.mouseWheel = function(e)
    {
        wheeldelta = 0;
        if (!e) { /* For IE. */
          e = window.event;
        }
        if (e.wheelDelta) { /* IE/Opera. */
          wheeldelta = e.wheelDelta/120;
        } else if (e.detail) { /** Mozilla case. */
          // In Mozilla, sign of delta is different than in IE, and delta is a multiple of 3.
          wheeldelta = -e.detail/3;
        }
        if (wheeldelta) { // Zoom in or out
            scale *= (wheeldelta > 0) ? 1.05 : 0.95;
            e.target.owner.render()
        }

        e.preventDefault();
        e.returnValue = false;
    }

    // Mouse events for the non-webGL version of the surface plot.
    this.mouseDownd = function(e) {   
        mouseDown1 = true;
        mouseButton1Down = getMousePositionFromEvent(e);
    };
    
    this.mouseUpd = function(e) {
        if (mouseDown1) { mouseButton1Up = lastMousePos; }
        mouseDown1 = false;
    };
    
    this.mouseIsMoving = function(e) {
        var self = e.target.owner;
        var currentPos = getMousePositionFromEvent(e);
        
        if (mouseDown1) {
            hideTooltip();
            self.calculateRotation(currentPos);
        } else {
            closestXToMouse = null;
            closestYToMouse = null;
            closestSurfaceToMouse = null;
            var closestDist = Number.MAX_VALUE;
            
            for (var k = 0; k < surfaces_points.length; k++) {
              var surface_points = surfaces_points[k];
              var n = surface_points.length;
              var m = surface_points[0].length;
              for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                  var point = surface_points[i][j];
                  var dist = distance({x:point.ax, y:point.ay}, currentPos);
    
                  if (dist < closestDist)
                  {
                      closestDist = dist;
                      closestXToMouse = i;
                      closestYToMouse = j;
                      closestSurfaceToMouse = k;
                  }
                }
              }
            }

            if (closestDist > 32) { // we're not close to any points
              hideTooltip();
            } else {
              displayTooltip(currentPos);
            }
        }
    };
    
    function getMousePositionFromEvent(e) {
        if (getInternetExplorerVersion() > -1)
        {
            var e = window.event;
            
            if (e.srcElement.getAttribute('Stroked'))
            {
                if (mousePosX == null || mousePosY == null) {return};
            }  else {
                mousePosX = e.offsetX;
                mousePosY = e.offsetY;
            }
        } else if (e.layerX || e.layerX == 0) { // Firefox
            mousePosX = e.layerX;
            mousePosY = e.layerY;
        }  else if (e.offsetX || e.offsetX == 0) { // Opera
            mousePosX = e.offsetX;
            mousePosY = e.offsetY;
        }
        
        var currentPos = new Point(mousePosX, mousePosY);
        return currentPos;
    }
    
    this.calculateRotation = function(e) {
        lastMousePos = new Point(DEFAULT_Z_ANGLE, DEFAULT_X_ANGLE);

        if (mouseButton1Up == null) {
            mouseButton1Up = new Point(DEFAULT_Z_ANGLE, DEFAULT_X_ANGLE);
        }

        if (mouseButton1Down != null) {
            lastMousePos = new Point(mouseButton1Up.x + (mouseButton1Down.x - e.x),//
            mouseButton1Up.y + (mouseButton1Down.y - e.y));
        }

        currentZAngle = lastMousePos.x % 360;
        currentXAngle = lastMousePos.y % 360;

        closestXToMouse = null;
        closestYToMouse = null;
        closestSurfaceToMouse = null;
        this.render();
    };
    
    this.init();
};

