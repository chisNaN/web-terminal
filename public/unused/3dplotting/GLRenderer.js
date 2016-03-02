"use strict";

var degToRad = function(degrees)
{
    return degrees * Math.PI / 180;
};

function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}


var GLRenderer = function(canvas, context, options) {
    var canvas = canvas;
    this.gl = context;

    this.scale = 1;
    var currentXAngle;
    var currentZAngle;

    this.points = new Array();
    var displayValues = null;

    var tTip = new Tooltip(false, options.tooltipColour);

    var rotationMatrix = mat4.create();

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
    
    this.surfaceVertexPositionBuffer = null;
    this.surfaceVertexColorBuffer = null;
    this.surfaceVertexNormalBuffer = null;
    this.surfaceVertexIndexBuffer = null;

    this.set_polygons= function(polygons) {
      this.polygons = polygons;
      //this.glSurface = new GLSurface(data3D, this);
      // search
    
      var vertices = [];
      var colors = [];
      var vertexNormals = [];
      
      var indices = [];

      for (var k = 0; k < this.polygons.length; k++) {
          // Create surface vertices.
          //
          // SAVE SPACE!  DECLARE TRIANGLES!
          //
          var polygon = this.polygons[k];
          if (polygon.points.length == 4) {
            var rawP1 = polygon.points[0];
            var rawP2 = polygon.points[1];
            var rawP3 = polygon.points[2];
            var rawP4 = polygon.points[3];
            
            indices.push(indices.length); indices.push(indices.length); indices.push(indices.length);
            indices.push(indices.length); indices.push(indices.length); indices.push(indices.length);
            indices.push(indices.length); indices.push(indices.length); indices.push(indices.length);
            indices.push(indices.length); indices.push(indices.length); indices.push(indices.length);

            vertices.push(rawP1.ax); vertices.push(rawP1.ay); vertices.push(rawP1.az);
            vertices.push(rawP2.ax); vertices.push(rawP2.ay); vertices.push(rawP2.az);
            vertices.push(rawP3.ax); vertices.push(rawP3.ay); vertices.push(rawP3.az);
            vertices.push(rawP4.ax); vertices.push(rawP4.ay); vertices.push(rawP4.az);
            
            // Surface colours.
            var rgb1 = rawP1.color;
            var rgb2 = rawP2.color;
            var rgb3 = rawP3.color;
            var rgb4 = rawP4.color;
            
            // TODO: why the 1.0?
            colors.push(rgb1.red/255); colors.push(rgb1.green/255); colors.push(rgb1.blue/255, 1.0);
            colors.push(rgb2.red/255); colors.push(rgb2.green/255); colors.push(rgb2.blue/255, 1.0);
            colors.push(rgb3.red/255); colors.push(rgb3.green/255); colors.push(rgb3.blue/255, 1.0);
            colors.push(rgb4.red/255); colors.push(rgb4.green/255); colors.push(rgb4.blue/255, 1.0);
            
            // Normal of triangle 1.
            var v1 = [rawP2.ax - rawP1.ax, rawP2.ay - rawP1.ay, rawP2.az - rawP1.az];
            var v2 = [rawP3.ax - rawP1.ax, rawP3.ay - rawP1.ay, rawP3.az - rawP1.az];
            var cp1 = vec3.create();
            cp1 = vec3.cross(v1, v2);
            cp1 = vec3.normalize(v1, v2);
            
            // Normal of triangle 2.
            v1 = [rawP3.ax - rawP1.ax, rawP3.ay - rawP1.ay, rawP3.az - rawP1.az];
            v2 = [rawP4.ax - rawP1.ax, rawP4.ay - rawP1.ay, rawP4.az - rawP1.az];
            var cp2 = vec3.create();
            cp2 = vec3.cross(v1, v2);
            cp2 = vec3.normalize(v1, v2);
            
            // Store normals for lighting.
            vertexNormals.push(cp1[0]); vertexNormals.push(cp1[1]); vertexNormals.push(cp1[2]);
            vertexNormals.push(cp1[0]); vertexNormals.push(cp1[1]); vertexNormals.push(cp1[2]);
            vertexNormals.push(cp2[0]); vertexNormals.push(cp2[1]); vertexNormals.push(cp2[2]);
            vertexNormals.push(cp2[0]); vertexNormals.push(cp2[1]); vertexNormals.push(cp2[2]);
          }
      }
      
      this.surfaceVertexPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexPositionBuffer);
      
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
      this.surfaceVertexPositionBuffer.itemSize = 3;
      this.surfaceVertexPositionBuffer.numItems = vertices.length; //vertices.length/3;
      
      this.surfaceVertexNormalBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexNormalBuffer);
      
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
      this.surfaceVertexNormalBuffer.itemSize = 3;
      this.surfaceVertexNormalBuffer.numItems = vertices.length; //vertices.length/3;
      
      this.surfaceVertexColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexColorBuffer);
      
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
      this.surfaceVertexColorBuffer.itemSize = 4;
      this.surfaceVertexColorBuffer.numItems = vertices.length; //vertices.length/3;
      
      this.surfaceVertexIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.surfaceVertexIndexBuffer);
      
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
      this.surfaceVertexIndexBuffer.itemSize = 1;
      this.surfaceVertexIndexBuffer.numItems = indices.length;
    };
    

    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();

    //TODO:    Is this necessary?
    var rSurface = 0;
    var lastTime = 0;
    this.animate = function() {
        var timeNow = new Date().getTime();
        
        if (lastTime != 0)
        {
            var elapsed = timeNow - lastTime;
            rSurface -= (75 * elapsed) / 1000.0;
        }
        
        lastTime = timeNow;
    };
    
    this.mvPushMatrix = function()
    {
        var copy = mat4.create();
        mat4.set(this.mvMatrix, copy);
        this.mvMatrixStack.push(copy);
    };
    
    this.mvPopMatrix = function()
    {
        if (this.mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        
        this.mvMatrix = this.mvMatrixStack.pop();
    };
    
    this.setMatrixUniforms = function(program, pMatrix, mvMatrix)
    {
        this.gl.uniformMatrix4fv(program.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(program.mvMatrixUniform, false, mvMatrix);
        
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        this.gl.uniformMatrix3fv(program.nMatrixUniform, false, normalMatrix); 
    };

    this.drawScene = function()
    {
      this.mvPushMatrix(this);
		
		  this.gl.useProgram(this.shaderProgram);
    
	    // Enable the vertex arrays for the current shader.
	    this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
	    this.shaderProgram.vertexNormalAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexNormal");
	    this.gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute); 
	    this.shaderProgram.vertexColorAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexColor");
	    this.gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        
      this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      mat4.perspective(5, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
      mat4.identity(this.mvMatrix);
      
      mat4.translate(this.mvMatrix, [0.0, -0.3, -19.0]);
      
      mat4.multiply(this.mvMatrix, rotationMatrix);
      
      var useLighting = true;
      
      if (useLighting) {
          this.gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
          
          var lightingDirection = [0.0, 0.0, 1.0];
          
          var adjustedLD = vec3.create();
          vec3.normalize(lightingDirection, adjustedLD);
          vec3.scale(adjustedLD, -1);
          this.gl.uniform3fv(this.shaderProgram.lightingDirectionUniform, adjustedLD);
          
          this.gl.uniform3f(this.shaderProgram.directionalColorUniform, 0.8, 0.8, 0.8);
      }
		
		  // Disable the vertex arrays for the current shader.
		  this.gl.disableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
      this.gl.disableVertexAttribArray(this.shaderProgram.vertexNormalAttribute); 
      this.gl.disableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
      
      this.mvPopMatrix(this);
    };

    this.tick = function() {
        var self = this;
        
        if (this.gl == null) {return;}
        
        var animator = function() {
        	if (self.gl == null) {return;}
        	
            self.drawScene();
            self.animate();
            requestAnimFrame(animator);
        };
        
        requestAnimFrame(animator);
        
        self.drawScene();
        self.animate();
    };

    this.currentShader = null; // TODO : is this necessary?

    this.render = function() {
      console.log(this.backColour)
      var r = hexToR(this.backColour)/255;
      var g = hexToG(this.backColour)/255;
      var b = hexToB(this.backColour)/255;
      
      
      this.currentShader = this.shaderProgram;
      this.gl.useProgram(this.currentShader);
  	
  	  // Enable the vertex arrays for the current shader.
  	  this.currentShader.vertexPositionAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexPosition");
      this.gl.enableVertexAttribArray(this.currentShader.vertexPositionAttribute);
      this.currentShader.vertexNormalAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexNormal");
      this.gl.enableVertexAttribArray(this.currentShader.vertexNormalAttribute);
      this.currentShader.vertexColorAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexColor");
      this.gl.enableVertexAttribArray(this.currentShader.vertexColorAttribute);
      
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexPositionBuffer);
      this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.surfaceVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexColorBuffer);
      this.gl.vertexAttribPointer(this.currentShader.vertexColorAttribute, this.surfaceVertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexNormalBuffer);
      this.gl.vertexAttribPointer(this.currentShader.vertexNormalAttribute, this.surfaceVertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.surfaceVertexIndexBuffer);
      
      this.setMatrixUniforms(this.currentShader, this.pMatrix, this.mvMatrix);
      
      this.gl.drawElements(this.gl.TRIANGLES, this.surfaceVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
  	
    	// Disable the vertex arrays for the current shader.
      this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
      this.gl.disableVertexAttribArray(this.currentShader.vertexNormalAttribute);
      this.gl.disableVertexAttribArray(this.currentShader.vertexColorAttribute);

      this.gl.clearColor(r, g, b, 0); // Set the background colour.
      this.gl.enable(this.gl.DEPTH_TEST);
      this.tick(); 

      //  
      //  transformation.init();
      //  transformation.rotate(currentXAngle, 0.0, currentZAngle);
      //  transformation.scale(this.scale);
      //  transformation.scale(drawingDim * .5);
      //  transformation.translate(width / 2.0, height / 2.0, 0.0);
      //  
      //  for (var i = 0; i < this.points.length; i++) {
      //    var point = transformation.transformPoint(this.points[i]);
      //    
      //    var x = point.ax;
      //    var y = point.ay;
      //    //console.log(x,y, point.size, point.color)
      //    
      //    canvasContext.beginPath();
      //    
      //    if (point.size < 0) {
      //      console.log("Negative radius!")
      //    } else {
      //      canvasContext.arc(x, y, point.size, 0, Math.PI * 2, true);
      //    }
      //    var rgbColour = point.color;
      //    var colr = "rgb(" + rgbColour.red + "," + rgbColour.green + "," + rgbColour.blue + ")";
      //    canvasContext.fillStyle = colr;
      //    canvasContext.strokeStyle = colr;
      //    // TODO:
      //    //if (this.scatters_data[k].filled) {
      //      canvasContext.fill();
      //    //} else {
      //      canvasContext.stroke();
      //    //}
      //  }

      //  draw points, colored, sized, filled or not
      //  draw polygons, colored, filled or not
      
      //  for (var i = 0; i < this.polygons.length; i++) {
      //    var polygon = this.polygons[i];
      //    
      //    if (polygon.type == "data")  {
      //        var rgbColour = polygon.color;
      //        var colr = "rgb(" + rgbColour.red + "," + rgbColour.green + "," + rgbColour.blue + ")";

      //        canvasContext.fillStyle = colr;
      //        canvasContext.strokeStyle = colr;
      //  
      //        canvasContext.beginPath();
      //        var n = polygon.points.length;
      //        canvasContext.moveTo(polygon.points[n-1].ax, polygon.points[n-1].ay);
      //        for (var k = 0; k < n; k ++) {
      //          canvasContext.lineTo(polygon.points[k].ax, polygon.points[k].ay);
      //        }
      //         
      //        if (polygon.fill) {
      //          canvasContext.fill();
      //        } else {
      //          canvasContext.stroke();
      //        }
      //    } else { // drawing a line of some sort
      //        var p1 = polygon.getPoint(0);
      //        var p2 = polygon.getPoint(1);
      //        canvasContext.beginPath();
      //        canvasContext.moveTo(p1.ax, p1.ay);
      //        canvasContext.lineTo(p2.ax, p2.ay);
      //        if (polygon.type == "axis") {
      //            canvasContext.strokeStyle='rgb(0, 0, 0)'; // axis color
      //        } else if (polygon.type == "tick") {
      //            canvasContext.strokeStyle='rgba(0, 0, 0, 0.5)'; // axis color
      //        } else if (polygon.type == "grid") {
      //            canvasContext.strokeStyle='rgba(0, 0, 0, 0.1)'; // axis color
      //        }
      //        canvasContext.stroke();
      //    }
      //  }
    };

    this.shaderProgram; // Non-texture shaders
    this.shaderTextureProgram; // Texture shaders
    this.shaderAxesProgram; // Axes shaders

    this.getShader = function(id) {
        var shaderScript = document.getElementById(id);
        
        if (!shaderScript) {return null;}
        
        var str = "";
        var k = shaderScript.firstChild;
        
        while (k) {
            if (k.nodeType == 3) {str += k.textContent;}
            k = k.nextSibling;
        }
        
        var shader;
        
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        } else {
            return null;
        }
        
        this.gl.shaderSource(shader, str);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert(this.gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    };
    
    this.createProgram = function(fragmentShaderID, vertexShaderID) {
    	if (this.gl == null) {return null;}
    		
        var fragmentShader = this.getShader(fragmentShaderID);
        var vertexShader = this.getShader(vertexShaderID);
        
        if (fragmentShader == null || vertexShader == null) { return null;}
        
        var program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        program.pMatrixUniform = this.gl.getUniformLocation(program, "uPMatrix");
        program.mvMatrixUniform = this.gl.getUniformLocation(program, "uMVMatrix");
        
        program.nMatrixUniform = this.gl.getUniformLocation(program, "uNMatrix");
        program.axesColour = this.gl.getUniformLocation(program, "uAxesColour");
        program.ambientColorUniform = this.gl.getUniformLocation(program, "uAmbientColor");
        program.lightingDirectionUniform = this.gl.getUniformLocation(program, "uLightingDirection");
        program.directionalColorUniform = this.gl.getUniformLocation(program, "uDirectionalColor"); 
        
        return program;
    };

    this.init = function() {
        mat4.identity(rotationMatrix);
        mat4.rotate(rotationMatrix, degToRad(-70), [1, 0, 0]);
        mat4.rotate(rotationMatrix, degToRad(-42), [0, 0, 1]);

        // initalize shaders
        // Non-texture shaders
        this.shaderProgram = this.createProgram("shader-fs", "shader-vs");
        // Texture shaders
        this.shaderTextureProgram = this.createProgram("texture-shader-fs", "texture-shader-vs");
        // Axes shaders
        this.shaderAxesProgram = this.createProgram("axes-shader-fs", "axes-shader-vs");
        
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            throw 'Error getting shaders';
        }
    };
    this.init();
};


//    this.gl = null;
//    var mouseDown = false;
//    var lastMouseX = null;
//    var lastMouseY = null;
//	
//    
//    // WebGL mouse handlers:
//    var shiftPressed = false;
//
//    this.handleMouseUp = function(event) {
//        mouseDown = false;
//    };
    
//	this.rotate = function(deltaX, deltaY) {
//		    var newRotationMatrix = mat4.create();
//        mat4.identity(newRotationMatrix);
//		
//	    	mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
//        mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
//        mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
//	}
//    
//    this.handleMouseMove = function(event, context) {
//        if (!mouseDown) { return;}
//    
//        var newX = event.clientX;
//        var newY = event.clientY;
//
//        var deltaX = newX - lastMouseX;
//        var deltaY = newY - lastMouseY;
//        var newRotationMatrix = mat4.create();
//        mat4.identity(newRotationMatrix);
//        
//        if (shiftPressed) { // scale
//            var s = deltaY < 0 ? 1.05 : 0.95;
//            mat4.scale(newRotationMatrix, [s, s, s]);
//            mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
//        } else { // rotate
//            mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
//            mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
//            mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
//        }
//
//        lastMouseX = newX;
//        lastMouseY = newY;
//    };
//    
//    this.createHiddenCanvasForGLText = function()
//    {
//        var hiddenCanvas = document.createElement("canvas");
//        hiddenCanvas.setAttribute("width", 512);
//        hiddenCanvas.setAttribute("height", 512);
//        this.context2D = hiddenCanvas.getContext('2d');
//        hiddenCanvas.style.display = 'none';
//        targetDiv.appendChild(hiddenCanvas);
//    };
//    
//};
//
