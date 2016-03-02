

GLText = function(data3D, text, pos, angle, surfacePlot, axis, align)
{
    this.shaderTextureProgram = surfacePlot.shaderTextureProgram;
    this.currenShader = null;
    this.gl = surfacePlot.gl;
    this.setMatrixUniforms = surfacePlot.setMatrixUniforms;
    
    this.vertexTextureCoordBuffer = null;
    this.textureVertexPositionBuffer = null;
    this.textureVertexIndexBuffer = null;
    this.context2D = surfacePlot.context2D;
    this.mvPushMatrix = surfacePlot.mvPushMatrix;
    this.mvPopMatrix = surfacePlot.mvPopMatrix;
    this.texture;
    this.text = text;
    this.angle = angle;
    this.pos = pos;
    this.surfacePlot = surfacePlot;
    this.textMetrics = null;
    this.axis = axis;
    this.align = align;
    
    this.setUpTextArea = function()
    {
        this.context2D.font = 'normal 28px Verdana';
        this.context2D.fillStyle = 'rgba(255,255,255,0)';
        this.context2D.fillRect(0,0, 512, 512);
        this.context2D.lineWidth = 3;
        this.context2D.textAlign = 'left';
        this.context2D.textBaseline = 'top';
    };
    
    this.writeTextToCanvas = function(text, idx)
    {
        this.context2D.save();
        this.context2D.clearRect (0 ,0 ,512 ,512);
        this.context2D.fillStyle = 'rgba(255, 255, 255, 0)';
        this.context2D.fillRect(0,0, 512, 512);
        
        var r = hexToR(this.surfacePlot.axisTextColour);
        var g = hexToG(this.surfacePlot.axisTextColour);
        var b = hexToB(this.surfacePlot.axisTextColour);
        
        this.context2D.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 255)'; // Set the axis label colour.
        this.textMetrics = this.context2D.measureText(text);
        
        if (this.axis == "y" || this.align == "left")
            this.context2D.fillText(text, 0, 0);
        else if (!this.align)
            this.context2D.fillText(text, 512-this.textMetrics.width, 0);
        
        if (this.align == "centre")
            this.context2D.fillText(text, 256-this.textMetrics.width/2, 0);
        if (this.align == "right")
            this.context2D.fillText(text, 512-this.textMetrics.width, 0);
        
        this.setTextureFromCanvas(this.context2D.canvas, this.texture, 0);
        
        this.context2D.restore();
    };
    
    this.setTextureFromCanvas = function(canvas, textTexture, idx)
    {
        this.gl.activeTexture(this.gl.TEXTURE0 + idx);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textTexture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        
        if (isPowerOfTwo(canvas.width) && isPowerOfTwo(canvas.height))
        {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        }
        else
        {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, textTexture);
    };
    
    function isPowerOfTwo(value)
    {
        return ((value & (value - 1)) == 0);
    }
    
    this.initTextBuffers = function()
    {
        
        // Text texture vertices
        this.textureVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVertexPositionBuffer);
        this.textureVertexPositionBuffer.itemSize = 3;
        this.textureVertexPositionBuffer.numItems = 4;
		this.shaderTextureProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderTextureProgram, "aTextureCoord");
		this.gl.vertexAttribPointer(this.shaderTextureProgram.textureCoordAttribute, this.textureVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVertexPositionBuffer);
        
        // Where we render the text.
        var texturePositionCoords = [
                                     -0.5, -0.5, 0.5,
                                     0.5, -0.5, 0.5,
                                     0.5, 0.5, 0.5,
                                     -0.5, 0.5, 0.5
                                     ];
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texturePositionCoords), this.gl.STATIC_DRAW);
        
        // Texture index buffer.
        this.textureVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.textureVertexIndexBuffer);
        
        var textureVertexIndices = [
                                    0, 1, 2,    0, 2, 3
                                    ];
        
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(textureVertexIndices), this.gl.STATIC_DRAW);
        this.textureVertexIndexBuffer.itemSize = 1;
        this.textureVertexIndexBuffer.numItems = 6;
        
        // Text textures
        this.vertexTextureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
		this.vertexTextureCoordBuffer.itemSize = 2;
        this.vertexTextureCoordBuffer.numItems = 4;
        this.gl.vertexAttribPointer(this.shaderTextureProgram.textureCoordAttribute,this.vertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        
        var textureCoords = [
                             0.0, 0.0,
                             1.0, 0.0,
                             1.0, 1.0,
                             0.0, 1.0
                             ];
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    };
    
    this.initTextBuffers();
    this.setUpTextArea();
    
    this.texture = this.gl.createTexture();
    this.writeTextToCanvas(this.text, this.idx);
};

GLText.prototype.draw = function()
{
    this.mvPushMatrix(this.surfacePlot);
    
    var rotationMatrix = mat4.create();
    mat4.identity(rotationMatrix);
    
    if (this.axis == "y")
    {
        mat4.translate(rotationMatrix, [0.0, 0.5, 0.5]);
        mat4.translate(rotationMatrix, [this.pos.x+0.53, this.pos.y+0.6, this.pos.z-0.5]);
        mat4.rotate(rotationMatrix, degToRad(this.angle), [1, 0, 0]);
        mat4.translate(rotationMatrix, [0.0, -0.5, -0.5]);
    }
    else if (this.axis == "x")
    {
        mat4.translate(rotationMatrix, [0.5, 0.5, 0.0]);
        mat4.translate(rotationMatrix, [this.pos.x-0.5, this.pos.y+0.47, this.pos.z-0.5]);
        mat4.rotate(rotationMatrix, degToRad(this.angle), [0, 0, 1]);
        mat4.translate(rotationMatrix, [-0.5, -0.5, 0]);
    }
    else if (this.axis == "z" && this.align == "centre") // Main Z-axis label.
    {
        mat4.translate(rotationMatrix, [0.0, 0.5, 0.5]);
        mat4.translate(rotationMatrix, [this.pos.x-0.3, this.pos.y+0.5, this.pos.z-0.5]);
        mat4.rotate(rotationMatrix, degToRad(this.angle), [1, 0, 0]);
        mat4.rotate(rotationMatrix, degToRad(this.angle), [0, 0, 1]);
        mat4.translate(rotationMatrix, [0.0, -0.5, -0.5]);
    }
    else if (this.axis == "z" && !this.align)
    {
        mat4.translate(rotationMatrix, [0.0, 0.5, 0.5]);
        mat4.translate(rotationMatrix, [this.pos.x-0.53, this.pos.y+0.5, this.pos.z-0.5]);
        mat4.rotate(rotationMatrix, degToRad(this.angle), [1, 0, 0]);
        mat4.translate(rotationMatrix, [0.0, -0.5, -0.5]);
    }
    
    mat4.multiply(this.surfacePlot.mvMatrix, rotationMatrix);
    
    // Enable blending for transparency.
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    
    // Text
    this.currentShader = this.shaderTextureProgram;
    this.gl.useProgram(this.currentShader);
	
	// Enable the vertex arrays for the current shader.
	this.currentShader.vertexPositionAttribute = this.gl.getAttribLocation(this.currentShader, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.currentShader.vertexPositionAttribute);
    this.currentShader.textureCoordAttribute = this.gl.getAttribLocation(this.currentShader, "aTextureCoord");
    this.gl.enableVertexAttribArray(this.currentShader.textureCoordAttribute);
    
    this.shaderTextureProgram.samplerUniform = this.gl.getUniformLocation(this.shaderTextureProgram, "uSampler");
	
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.currentShader.vertexPositionAttribute, this.textureVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
    this.gl.vertexAttribPointer(this.currentShader.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.currentShader.samplerUniform, 0);
    
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.textureVertexIndexBuffer);
    
    this.setMatrixUniforms(this.currentShader, this.surfacePlot.pMatrix, this.surfacePlot.mvMatrix);
    
    this.gl.drawElements(this.gl.TRIANGLES, this.textureVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    
    // Disable blending for transparency.
    this.gl.disable(this.gl.BLEND);
    this.gl.enable(this.gl.DEPTH_TEST);
	
	// Disable the vertex arrays for the current shader.
	this.gl.disableVertexAttribArray(this.currentShader.vertexPositionAttribute);
	this.gl.disableVertexAttribArray(this.currentShader.textureCoordAttribute);
    
    this.mvPopMatrix(this.surfacePlot);
};
