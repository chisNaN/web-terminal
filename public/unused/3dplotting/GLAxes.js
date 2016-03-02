
/*
 * This class represents the axes for the webGL plot.
 */
GLAxes = function(data3D, surfacePlot)
{
    this.shaderProgram = surfacePlot.shaderAxesProgram;
    this.currenShader = null;
    this.gl = surfacePlot.gl;
    this.numXPoints = surfacePlot.numXPoints;
    this.numYPoints = surfacePlot.numYPoints;
    this.data3D = data3D;
    this.setMatrixUniforms = surfacePlot.setMatrixUniforms;
    this.axesVertexPositionBuffer = null;
    this.axesMinorVertexPositionBuffer = null;
    this.surfaceVertexColorBuffer = null;
    this.surfacePlot = surfacePlot;
    
    this.labels = [];
    
    this.initAxesBuffers = function()
    {
        var vertices = [];
        var minorVertices = [];
        var axisExtent = 0.5;
        
        var axisOrigin  = [-axisExtent, axisExtent, 0];
        var xAxisEndPoint = [axisExtent, axisExtent, 0];
        var yAxisEndPoint = [-axisExtent, -axisExtent, 0];
        var zAxisEndPoint = [-axisExtent, axisExtent, axisExtent*2];
        
        var xAxisEndPoint2 = [axisExtent, -axisExtent, 0];
        var zAxisEndPoint2 = [-axisExtent, -axisExtent, axisExtent*2];
        
        // X
        vertices = vertices.concat(yAxisEndPoint);
        vertices = vertices.concat(xAxisEndPoint2);
        
        // Y
        vertices = vertices.concat(xAxisEndPoint2);
        vertices = vertices.concat(xAxisEndPoint);
        
        // Z2
        vertices = vertices.concat(yAxisEndPoint);
        vertices = vertices.concat(zAxisEndPoint2);
        
        // Major axis lines.
        this.axesVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesVertexPositionBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
        this.axesVertexPositionBuffer.itemSize = 3;
        this.axesVertexPositionBuffer.numItems = vertices.length/3;
        
        // Minor axis lines
        var lineIntervalX = axisExtent/(this.surfacePlot.glOptions.xTicksNum/2);
        var lineIntervalY = axisExtent/(this.surfacePlot.glOptions.yTicksNum/2);
        var lineIntervalZ = axisExtent/(this.surfacePlot.glOptions.zTicksNum/2);
        
        var i = 0;
        
        // X-axis division lines
        for (var count = 0; count <= this.surfacePlot.glOptions.xTicksNum; i += lineIntervalX, count++)
        {
            // X-axis labels.
            var labels = this.surfacePlot.glOptions.xLabels;
            var label = labels[count];
            
            labelPos = {x: yAxisEndPoint[0]+i-0.02, y: yAxisEndPoint[1]-1, z: yAxisEndPoint[2]};
            glText = new GLText(data3D, label, labelPos, 90, surfacePlot, "x");
            this.labels.push(glText);
            
            // X-axis divisions.
            minorVertices = minorVertices.concat([axisOrigin[0]+i, axisOrigin[1], axisOrigin[2]]);
            minorVertices = minorVertices.concat([yAxisEndPoint[0]+i, yAxisEndPoint[1], yAxisEndPoint[2]]);
            
            // back wall x-axis divisions.
            minorVertices = minorVertices.concat([axisOrigin[0]+i, axisOrigin[1], 0]);
            minorVertices = minorVertices.concat([axisOrigin[0]+i, axisOrigin[1], axisExtent*2]);
        }
        
        i = 0;
        
        // Y-axis division lines
        for (var count = 0; count <= this.surfacePlot.glOptions.yTicksNum; i += lineIntervalY, count++)
        {
            // Y-axis labels.
            var labels = this.surfacePlot.glOptions.yLabels;
            var label = labels[this.surfacePlot.glOptions.yTicksNum-count];
            
            labelPos = {x: xAxisEndPoint[0], y: xAxisEndPoint[1]-i-1.06, z: xAxisEndPoint[2]};
            glText = new GLText(data3D, label, labelPos, 0, surfacePlot, "y");
            this.labels.push(glText);
            
            // y-axis divisions
            minorVertices = minorVertices.concat([axisOrigin[0], axisOrigin[1]-i, axisOrigin[2]]);
            minorVertices = minorVertices.concat([xAxisEndPoint[0], xAxisEndPoint[1]-i, xAxisEndPoint[2]]);
            
            // left wall y-axis divisions.
            minorVertices = minorVertices.concat([axisOrigin[0], axisOrigin[1]-i, 0]);
            minorVertices = minorVertices.concat([axisOrigin[0], axisOrigin[1]-i, axisExtent*2]);
        }
        
        i = 0;
        
        // Z-axis division lines
        for (var count = 0; count <= this.surfacePlot.glOptions.zTicksNum; i += lineIntervalZ, count++)
        {
            // Z-axis labels.
            var labels = this.surfacePlot.glOptions.zLabels;
            var label = labels[count];
            
            var labelPos = {x: yAxisEndPoint[0], y: yAxisEndPoint[1]-1, z: yAxisEndPoint[2]+i+0.03};
            var glText = new GLText(data3D, label, labelPos, 90, surfacePlot, "z");
            this.labels.push(glText);
            
            // Z-axis divisions
            minorVertices = minorVertices.concat([axisOrigin[0], axisOrigin[1], axisOrigin[2]+i]);
            minorVertices = minorVertices.concat([yAxisEndPoint[0], yAxisEndPoint[1], yAxisEndPoint[2]+i]);
            
            // back wall z-axis divisions
            minorVertices = minorVertices.concat([axisOrigin[0], axisOrigin[1], axisOrigin[2]+i]);
            minorVertices = minorVertices.concat([xAxisEndPoint[0], xAxisEndPoint[1], xAxisEndPoint[2]+i]);
            
        }
        
        // Set up the main X-axis label.
        var labelPos = {x: 0.5, y: yAxisEndPoint[1]-1.35, z: yAxisEndPoint[2]};
        var glText = new GLText(data3D, this.surfacePlot.xTitle, labelPos, 0, surfacePlot, "x", "centre");
        this.labels.push(glText);
        
        // Set up the main Y-axis label.
        labelPos = {x: xAxisEndPoint[0]+0.2, y: -0.5, z: xAxisEndPoint[2]};
        glText = new GLText(data3D, this.surfacePlot.yTitle, labelPos, 90, surfacePlot, "x", "centre");
        this.labels.push(glText);
        
        // Set up the main Z-axis label.
        labelPos = {x: yAxisEndPoint[0], y: yAxisEndPoint[1]-1, z: 0.5};
        glText = new GLText(data3D, this.surfacePlot.zTitle, labelPos, 90, surfacePlot, "z", "centre");
        this.labels.push(glText);
        
        // Set up the minor axis grid lines.
        this.axesMinorVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesMinorVertexPositionBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(minorVertices), this.gl.DYNAMIC_DRAW);
        this.axesMinorVertexPositionBuffer.itemSize = 3;
        this.axesMinorVertexPositionBuffer.numItems = minorVertices.length/3;
    };
    
    this.initAxesBuffers();
};

GLAxes.prototype.draw = function()
{
    this.currentShader = this.shaderProgram;
    this.gl.useProgram(this.currentShader);
	
	// Enable the vertex array for the current shader.
	this.currentShader.vertexPositionAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    
    this.gl.uniform3f(this.currentShader.axesColour, 0.0, 0.0, 0.0); // Set the colour of the Major axis lines.
    
    // Major axis lines
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.axesVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.lineWidth(2);
    this.setMatrixUniforms(this.currentShader, this.surfacePlot.pMatrix, this.surfacePlot.mvMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.axesVertexPositionBuffer.numItems);
    
    // Minor axis lines
    this.gl.uniform3f(this.currentShader.axesColour, 0.3, 0.3, 0.3); // Set the colour of the minor axis grid lines.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesMinorVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.axesMinorVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.lineWidth(1);
    this.gl.drawArrays(this.gl.LINES, 0, this.axesMinorVertexPositionBuffer.numItems);
    
    // Render the axis labels.
    var numLabels = this.labels.length;
	
	// Enable the vertex array for the current shader.
	this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    
    for (var i = 0; i < numLabels; i++)
        this.labels[i].draw();
};
