'use strict';

/*
 * SurfacePlot.js
 *
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


/*
 * This class does most of the work.
 * *********************************
 */
var GLSurfacePlot = function(targetElement, options, glOptions) {

  // SHOULDNT BE HERE
    var xLabels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var yLabels = [0, 1, 2, 3, 4, 5];
    var zLabels = [0, 1, 2, 3, 4, 5, 6]; // These labels ar eused when autoCalcZScale is false;
    var glOptions = {xLabels: xLabels, yLabels: yLabels, zLabels: zLabels, autoCalcZScale: false};

    this.xTitle = options.xTitle;
    this.yTitle = options.yTitle;
    this.zTitle = options.zTitle;
    
    this.backColour = options.backColour;
    this.axisTextColour = options.axisTextColour;
    
    var origin = options.origin;
    var startXAngle = options.startXAngle;
    var startZAngle = options.startZAngle;

    this.glOptions = glOptions;
    var targetDiv;
    var id;
    var canvas;
    var canvasContext = null;
    this.context2D = null;
    var scale = GLSurfacePlot.DEFAULT_SCALE;
    var currentXAngle = GLSurfacePlot.DEFAULT_X_ANGLE;
    var currentZAngle = GLSurfacePlot.DEFAULT_Z_ANGLE;
    
    if (startXAngle != null && startXAngle != void 0)
        currentXAngle = startXAngle;
    
    if (startZAngle != null && startZAngle != void 0)
        currentZAngle = startZAngle;
        

    this.data = null;
    var data3ds = null;
    var displayValues = null;
    this.numXPoints = 0;
    this.numYPoints = 0;
    var transformation;
    var cameraPosition;
    this.colourGradient;
    
    this.glSurface = null;
    this.glAxes = null;
    this.useWebGL = false;
    this.gl = null;
    this.shaderProgram = null;
    this.shaderTextureProgram = null;
    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();
    var rSurface = 0;
    var mouseDown = false;
    var lastMouseX = null;
    var lastMouseY = null;
    var rotationMatrix = mat4.create();
	
	  function getInternetExplorerVersion() {   // Returns the version of Internet Explorer or a -1 (indicating the use of another browser).
      var rv = -1; // Return value assumes failure.
      if (navigator.appName == 'Microsoft Internet Explorer') {
          var ua = navigator.userAgent;
          var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
          if (re.exec(ua) != null) {rv = parseFloat(RegExp.$1)};
      }
      return rv;
    }
    
    function supports_canvas() {
         return !!document.createElement('canvas').getContext;
    }
    
    this.init = function() {
        mat4.identity(rotationMatrix);
        mat4.rotate(rotationMatrix, degToRad(-70), [1, 0, 0]);
        mat4.rotate(rotationMatrix, degToRad(-42), [0, 0, 1]);
        transformation = new Transformation3d();
        
        this.createTargetDiv(); 
        
        if (!targetDiv) {return;}
        
        this.createCanvas();
	       
        this.glOptions.xTicksNum = this.glOptions.xLabels.length-1;
        this.glOptions.yTicksNum = this.glOptions.yLabels.length-1;
        this.glOptions.zTicksNum = this.glOptions.zLabels.length-1;
    };

    this.draw = function() {
        this.init();
        this.redraw();
    };
    

    this.add_scatter_data = function(scatter_data) { // sets the data
    }

    this.add_surface_data = function(surface_data) { // sets the data
        this.data = surface_data.zValues;
        this.determineMinMaxZValues();
    }
    
    this.determineMinMaxZValues = function()
    {
    	this.numXPoints = this.data.length;
      this.numYPoints = this.data[0].length;
    	this.minZValue = Number.MAX_VALUE;
      this.maxZValue = Number.MIN_VALUE;
        
      for (var i = 0; i < this.numXPoints; i++) {
          for (var j = 0; j < this.numYPoints; j++) {
              var value = this.data[i][j];
              if (value < this.minZValue) {this.minZValue = value;}
              if (value > this.maxZValue) {this.maxZValue = value;}
          }
      }
    }
    
    this.cleanUp = function()
    {
    	this.gl = null;
    	
    	canvas.onmousedown = null;
  		document.onmouseup = null;
  		document.onmousemove = null;
		
  		this.numXPoints = 0;
    	this.numYPoints = 0;
  		canvas = null;
    	canvasContext = null;
    	this.data = null;
    	this.colourGradientObject = null;
    	this.glSurface = null;
	    this.glAxes = null;
	    this.shaderProgram = null;
	    this.shaderTextureProgram = null;
      this.shaderAxesProgram = null;
	    this.mvMatrix = null;
	    this.mvMatrixStack = null;
	    this.pMatrix = null;
    }
    
    this.render = function()
    {
        if (this.useWebGL) { // Render shiny WebGL surface plot.
            var r = hexToR(this.backColour)/255;
            var g = hexToG(this.backColour)/255;
            var b = hexToB(this.backColour)/255;
            
            this.initWorldObjects(data3ds);
            this.gl.clearColor(r, g, b, 0); // Set the background colour.
            this.gl.enable(this.gl.DEPTH_TEST);
            this.tick(); 
        }
    };
    
    this.getDefaultColourRamp = function()
    {
        var colour1 = {red:0, green:0, blue:255};
        var colour2 = {red:0, green:255, blue:255};
        var colour3 = {red:0, green:255, blue:0};
        var colour4 = {red:255, green:255, blue:0};
        var colour5 = {red:255, green:0, blue:0};
        return [colour1, colour2, colour3, colour4, colour5];
    };
    
    this.redraw = function()
    {
        this.colourGradient = this.getDefaultColourRamp()
        var cGradient = this.colourGradient;
        
        this.colourGradientObject = new ColourGradient(this.minZValue, this.maxZValue, cGradient);
        
        var canvasWidth = this.gl.viewportWidth;
        var canvasHeight = this.gl.viewportHeight;
        
        var minMargin = 20;
        var drawingDim = canvasWidth - minMargin * 2;
        var marginX = minMargin;
        var marginY = minMargin;
        
        if (canvasWidth > canvasHeight)
        {
            drawingDim = canvasHeight - minMargin * 2;
            marginX = (canvasWidth - drawingDim) / 2;
        }
        else if (canvasWidth < canvasHeight)
        {
            drawingDim = canvasWidth - minMargin * 2;
            marginY = (canvasHeight - drawingDim) / 2;
        }
        
        var xDivision = 1 / (this.numXPoints - 1);
        var yDivision = 1 / (this.numYPoints - 1);
        var xPos, yPos;
        var i, j;
        var numPoints = this.numXPoints * this.numYPoints;
        data3ds = new Array();
        var index = 0;
        var colIndex;
        
        for (i = 0, xPos = -0.5; i < this.numXPoints; i++, xPos += xDivision) {
            for (j = 0, yPos = 0.5; j < this.numYPoints; j++, yPos -= yDivision) {
                var x = xPos;
                var y = yPos;
                
                if (this.useWebGL)
                	colIndex = this.numYPoints-1-j;
                else
                	colIndex = j;
                	
                var z = this.scale_to(this.data[i][colIndex], this.minZValue, this.maxZValue);
                data3ds[index] = new Point3D(x, y, z); // Reverse the y-axis to match the non-webGL surface.
                index++;
            }
        }
        
        this.render();
    };

    this.scale_to = function(x, min, max, scaled_min, scaled_max) {
      if (scaled_min == undefined) scaled_min = -0.5;
      if (scaled_max == undefined) scaled_max = 0.5;
      var a = (scaled_max - scaled_min) / (max - min + 0.0)
      var b = scaled_max - a * max
      return a * x + b
    }
    
    this.createTargetDiv = function() {
        targetDiv = document.createElement("div");
        targetDiv.className = "surfaceplot";
        targetDiv.style.background = '#ffffff';
        targetDiv.style.position = 'absolute';
        
        if (!targetElement) 
            return;//document.body.appendChild(this.targetDiv);
        else 
        {
            targetDiv.style.position = 'relative';
            targetElement.appendChild(targetDiv);
        }
        
        targetDiv.style.left = 0 + "px";
        targetDiv.style.top = 0 + "px";
    };
    
    this.getShader = function(id)
    {
        var shaderScript = document.getElementById(id);
        
        if (!shaderScript) {return null;}
        
        var str = "";
        var k = shaderScript.firstChild;
        
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
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
    
    
    this.initShaders = function()
    {
    	if (this.gl == null) {return false;}
    		
        // Non-texture shaders
        this.shaderProgram = this.createProgram("shader-fs", "shader-vs");
        // Texture shaders
        this.shaderTextureProgram = this.createProgram("texture-shader-fs", "texture-shader-vs");
        // Axes shaders
        this.shaderAxesProgram = this.createProgram("axes-shader-fs", "axes-shader-vs");
        
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            return false;
        }
        
        return true;
    };
    
    this.mvPushMatrix = function(surfacePlot)
    {
        var copy = mat4.create();
        mat4.set(surfacePlot.mvMatrix, copy);
        surfacePlot.mvMatrixStack.push(copy);
    };
    
    this.mvPopMatrix = function(surfacePlot)
    {
        if (surfacePlot.mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        
        surfacePlot.mvMatrix = surfacePlot.mvMatrixStack.pop();
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
    
    this.initWorldObjects = function(data3D) {
        this.glSurface = new GLSurface(data3D, this);
        this.glAxes = new GLAxes(data3D, this);
    };
    
    // WebGL mouse handlers:
    var shiftPressed = false;

    this.handleMouseUp = function(event) {
        mouseDown = false;
    };

    this.drawScene = function() {
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
      
      this.glAxes.draw();
      this.glSurface.draw();
      
      this.mvPopMatrix(this);
    };
    
    var lastTime = 0;
    
    this.animate = function() {
        var timeNow = new Date().getTime();
        
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;
            rSurface -= (75 * elapsed) / 1000.0;
        }
        
        lastTime = timeNow;
    };
    
    this.tick = function() {
        var self = this;
        
        if (this.gl == null) {return;}
        
        var animator = function()
        {
        	if (self.gl == null) {return;}
        	
            self.drawScene();
            self.animate();
            requestAnimFrame(animator);
        };
        
        requestAnimFrame(animator);
        
        self.drawScene();
        self.animate();
    };
    
    this.isWebGlEnabled = function()
    {
    	var enabled = true;
    	
        return enabled && this.initShaders();
    };
	
	this.rotate = function(deltaX, deltaY) {
		var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
		
		mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
        mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
        mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
	}
    
    this.handleMouseMove = function(event, context) {
        if (!mouseDown) { return;}
    
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        
        if (shiftPressed) { // scale
            var s = deltaY < 0 ? 1.05 : 0.95;
            mat4.scale(newRotationMatrix, [s, s, s]);
            mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
        } else { // rotate
            mat4.rotate(newRotationMatrix, degToRad(deltaX / 2), [0, 1, 0]);
            mat4.rotate(newRotationMatrix, degToRad(deltaY / 2), [1, 0, 0]);
            mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
        }

        lastMouseX = newX;
        lastMouseY = newY;
    };
    
    this.initGL = function(canvas) {
        var canUseWebGL = false;
        
        try {
            this.gl = canvas.getContext("experimental-webgl", { alpha: false });
            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;

            canUseWebGL = this.isWebGlEnabled();
            var self = this;
            
            var handleMouseDown = function(event) {
		            shiftPressed = isShiftPressed(event);
		            
		            mouseDown = true;
		            lastMouseX = event.clientX;
		            lastMouseY = event.clientY;
		            
	            	document.onmouseup = self.handleMouseUp;
	            	document.onmousemove = function(event){ self.handleMouseMove(event, self) };//self.handleMouseMove;
		        };
            
            canvas.onmousedown = handleMouseDown;
            document.onmouseup = this.handleMouseUp;
            document.onmousemove = function(event){ self.handleMouseMove(event, self) };//this.handleMouseMove;
        } catch (e) {
          console.log("ERROR", e)
        }
    
        return canUseWebGL;
    };
    
    
    this.createCanvas = function() {
        canvas = document.createElement("canvas");
        
        if (!supports_canvas()) {
            G_vmlCanvasManager.initElement(canvas);
            canvas.style.width = width;
            canvas.style.height = height;
        } else {
            canvas.setAttribute("width", $(targetElement).width());
            canvas.setAttribute("height", $(targetElement).height());
            canvas.style.left = '0px';
            canvas.style.top =  '0px';
            
            targetDiv.appendChild(canvas);

            this.useWebGL = this.initGL(canvas);
        }
            
        
        if (this.useWebGL) {this.createHiddenCanvasForGLText();}
    };
    
    this.createHiddenCanvasForGLText = function() {
        var hiddenCanvas = document.createElement("canvas");
        hiddenCanvas.setAttribute("width", 512);
        hiddenCanvas.setAttribute("height", 512);
        this.context2D = hiddenCanvas.getContext('2d');
        hiddenCanvas.style.display = 'none';
        targetDiv.appendChild(hiddenCanvas);
    };
    

    function isShiftPressed(e) {
        var shiftPressed=0;

         if (parseInt(navigator.appVersion)>3) {
            var evt = navigator.appName=="Netscape" ? e:event;
            if (navigator.appName=="Netscape" && parseInt(navigator.appVersion)==4) {
                // NETSCAPE 4 CODE
                var mString =(e.modifiers+32).toString(2).substring(3,6);
                shiftPressed=(mString.charAt(0)=="1");
            } else {
                // NEWER BROWSERS [CROSS-PLATFORM]
                shiftPressed=evt.shiftKey;
            }
            if (shiftPressed)  {return true;}
        }
        return false;
    }
        
};

var degToRad = function(degrees)
{
    return degrees * Math.PI / 180;
};

function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}


GLSurfacePlot.DEFAULT_X_ANGLE   = 47;
GLSurfacePlot.DEFAULT_Z_ANGLE   = 47;
GLSurfacePlot.DATA_DOT_SIZE     = 5;
GLSurfacePlot.DEFAULT_SCALE     = 350;
GLSurfacePlot.MIN_SCALE         = 50;
GLSurfacePlot.MAX_SCALE         = 1100;
GLSurfacePlot.SCALE_FACTOR      = 1.4;

