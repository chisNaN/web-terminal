"use strict";

var CanvasRenderer = function(canvas, context, options) {
    var canvas = canvas;
    var canvasContext = context;

    this.scale = 1;
    var currentXAngle;
    var currentZAngle;

    this.points = new Array();
    var displayValues = null;

    var transformation = new Th3dtran();

    var tTip = new Tooltip(false, options.tooltipColour);

    this.backColour = '#ffffff';
    
    this.setXAngle = function(xAngle){
      currentXAngle = xAngle;
    }
    this.setZAngle = function(zAngle){
      currentZAngle = zAngle;
    }
    this.setScale = function(scale){
      this.scale = scale;
    }

    this.setBackColour= function(backColour) {
      this.backColour = backColour;
    }

    this.set_points= function(points) {
      this.points = points;
    }
    
    this.set_polygons= function(polygons) {
      this.polygons = polygons;
    }

    this.render = function() {
      // TODO: properly sort points AND polygons TOGETHER
      
        var width = canvas.width;
        var height = canvas.height;
        canvasContext.clearRect(0, 0, width, height);
        canvasContext.fillStyle = this.backColour;
        canvasContext.fillRect(0, 0, width, height);
        canvasContext.textAlign = 'center'; 

        var drawingDim = Math.min(width, height);
        
        transformation.init();
        transformation.rotate(currentXAngle, 0.0, currentZAngle);
        transformation.scale(this.scale);
        transformation.scale(drawingDim * .5);
        transformation.translate(width / 2.0, height / 2.0, 0.0);
        
        // Sort the polygons so that the closest ones are rendered last
        // and therefore are not occluded by those behind them.
        // This is really Painter's algorithm.
        this.polygons.sort(PolygonComparator);
        
        canvasContext.lineWidth = 1;
        canvasContext.lineJoin = "round";
        var count = 0;
        
        for (var i = 0; i < this.polygons.length; i++) {
          var polygon = this.polygons[i];
          var n = polygon.points.length;
          for (var k = 0; k < n; k ++) {
            polygon.points[k] = transformation.transformPoint(polygon.points[k]);
          }
          
          if (polygon.type == "data")  {
              var rgbColour = polygon.color;
              var colr = "rgb(" + rgbColour.red + "," + rgbColour.green + "," + rgbColour.blue + ")";

              canvasContext.fillStyle = colr;
              canvasContext.strokeStyle = colr;
        
              canvasContext.beginPath();
              canvasContext.moveTo(polygon.points[n-1].ax, polygon.points[n-1].ay);
              for (var k = 0; k < n; k ++) {
                canvasContext.lineTo(polygon.points[k].ax, polygon.points[k].ay);
              }
               
              if (polygon.fill) {
                canvasContext.fill();
              } else {
                canvasContext.stroke();
              }
          } else { // drawing a line of some sort
              var p1 = polygon.getPoint(0);
              var p2 = polygon.getPoint(1);
              canvasContext.beginPath();
              canvasContext.moveTo(p1.ax, p1.ay);
              canvasContext.lineTo(p2.ax, p2.ay);
              if (polygon.type == "axis") {
                  canvasContext.strokeStyle='rgb(0, 0, 0)'; // axis color
              } else if (polygon.type == "tick") {
                  canvasContext.strokeStyle='rgba(0, 0, 0, 0.5)'; // axis color
              } else if (polygon.type == "grid") {
                  canvasContext.strokeStyle='rgba(0, 0, 0, 0.1)'; // axis color
              }
              canvasContext.stroke();
          }
        }

        for (var i = 0; i < this.points.length; i++) {
          var point = transformation.transformPoint(this.points[i]);
          
          var x = point.ax;
          var y = point.ay;
          //console.log(x,y, point.size, point.color)
          
          canvasContext.beginPath();
          
          if (point.size < 0) {
            console.log("Negative radius!")
          } else {
            canvasContext.arc(x, y, point.size, 0, Math.PI * 2, true);
          }
          var rgbColour = point.color;
          var colr = "rgb(" + rgbColour.red + "," + rgbColour.green + "," + rgbColour.blue + ")";
          canvasContext.fillStyle = colr;
          canvasContext.strokeStyle = colr;
          // TODO:
          //if (this.scatters_data[k].filled) {
            canvasContext.fill();
          //} else {
            canvasContext.stroke();
          //}
          if (point.text) {
            canvasContext.font = point.font; 
            canvasContext.fillText(point.text, x, y);
          }
        }

    };

};

