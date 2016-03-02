
/*
 * A webGL surface without axes nor any other decoration.
 */
GLSurface = function(data3D, surfacePlot) {
    this.shaderProgram = surfacePlot.shaderProgram;
    this.currentShader = null;
    this.gl = surfacePlot.gl;
    this.numXPoints = surfacePlot.numXPoints;
    this.numYPoints = surfacePlot.numYPoints;
    this.data3D = data3D;
    this.colourGradientObject = surfacePlot.colourGradientObject;
    this.setMatrixUniforms = surfacePlot.setMatrixUniforms;
    
    this.surfaceVertexPositionBuffer = null;
    this.surfaceVertexColorBuffer = null;
    this.surfaceVertexNormalBuffer = null;
    this.surfaceVertexIndexBuffer = null;
    this.surfacePlot = surfacePlot;
    
    this.initSurfaceBuffers = function()
    {
        var vertices = [];
        var colors = [];
        var vertexNormals = [];
        
        for (var i = 0; i < this.numXPoints - 1; i++) {
            for (var j = 0; j < this.numYPoints-1; j++) {
                // Create surface vertices.
                var rawP1 = this.data3D[j + (i * this.numYPoints)];
                var rawP2 = this.data3D[j + (i * this.numYPoints) + this.numYPoints];
                var rawP3 = this.data3D[j + (i * this.numYPoints) + this.numYPoints + 1];
                var rawP4 = this.data3D[j + (i * this.numYPoints) + 1];
                
                vertices.push(rawP1.ax); vertices.push(rawP1.ay); vertices.push(rawP1.az);
                vertices.push(rawP2.ax); vertices.push(rawP2.ay); vertices.push(rawP2.az);
                vertices.push(rawP3.ax); vertices.push(rawP3.ay); vertices.push(rawP3.az);
                vertices.push(rawP4.ax); vertices.push(rawP4.ay); vertices.push(rawP4.az);
                
                // Surface colours.
                var rgb1 = this.colourGradientObject.getColour(rawP1.lz * 1.0);
                var rgb2 = this.colourGradientObject.getColour(rawP2.lz * 1.0);
                var rgb3 = this.colourGradientObject.getColour(rawP3.lz * 1.0);
                var rgb4 = this.colourGradientObject.getColour(rawP4.lz * 1.0);
                
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
        this.surfaceVertexPositionBuffer.numItems = vertices.length/3;
        
        this.surfaceVertexNormalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexNormalBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
        this.surfaceVertexNormalBuffer.itemSize = 3;
        this.surfaceVertexNormalBuffer.numItems = vertices.length/3;
        
        this.surfaceVertexColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.surfaceVertexColorBuffer);
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.surfaceVertexColorBuffer.itemSize = 4;
        this.surfaceVertexColorBuffer.numItems = vertices.length/3;
        
        this.surfaceVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.surfaceVertexIndexBuffer);
        
        var numQuads = ((this.numXPoints-1) * (this.numYPoints-1))/2;
        var surfaceVertexIndices = [];
        
        for (var i = 0; i < (numQuads*8); i += 4)
        {
            surfaceVertexIndices = surfaceVertexIndices.concat([i, i+1, i+2, i, i+2, i+3]);
        }
        
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceVertexIndices), this.gl.STATIC_DRAW);
        this.surfaceVertexIndexBuffer.itemSize = 1;
        this.surfaceVertexIndexBuffer.numItems = surfaceVertexIndices.length;
    };
    
    this.initSurfaceBuffers();

    this.draw = function() {
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
      
      this.setMatrixUniforms(this.currentShader, this.surfacePlot.pMatrix, this.surfacePlot.mvMatrix);
      
      this.gl.drawElements(this.gl.TRIANGLES, this.surfaceVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
  	
    	// Disable the vertex arrays for the current shader.
      this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
      this.gl.disableVertexAttribArray(this.currentShader.vertexNormalAttribute);
      this.gl.disableVertexAttribArray(this.currentShader.vertexColorAttribute);
    };

};
