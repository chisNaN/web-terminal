/*
 * Matrix3d: This class represents a 3D matrix.
 * ********************************************
 */
Matrix3d = function()
{
    this.matrix = new Array();
    this.numRows = 4;
    this.numCols = 4;
    
    this.init = function()
    {
        this.matrix = new Array();
        
        for (var i = 0; i < this.numRows; i++)
        {
            this.matrix[i] = new Array();
        }
    };

    this.getMatrix = function()
    {
        return this.matrix;
    };

    this.matrixReset = function()
    {
        for (var i = 0; i < this.numRows; i++)
        {
            for (var j = 0; j < this.numCols; j++)
            {
                this.matrix[i][j] = 0;
            }
        }
    };

    this.matrixIdentity = function()
    {
        this.matrixReset();
        this.matrix[0][0] = this.matrix[1][1] = this.matrix[2][2] = this.matrix[3][3] = 1;
    };

    this.matrixCopy = function(newM)
    {
        var temp = new Matrix3d();
        var i, j;

        for (i = 0; i < this.numRows; i++)
        {
            for (j = 0; j < this.numCols; j++)
            {
                temp.getMatrix()[i][j] = (this.matrix[i][0] * newM.getMatrix()[0][j]) + (this.matrix[i][1] * newM.getMatrix()[1][j]) + (this.matrix[i][2] * newM.getMatrix()[2][j]) + (this.matrix[i][3] * newM.getMatrix()[3][j]);
            }
        }

        for (i = 0; i < this.numRows; i++)
        {
            this.matrix[i][0] = temp.getMatrix()[i][0];
            this.matrix[i][1] = temp.getMatrix()[i][1];
            this.matrix[i][2] = temp.getMatrix()[i][2];
            this.matrix[i][3] = temp.getMatrix()[i][3];
        }
    };

    this.matrixMult = function(m1, m2)
    {
        var temp = new Matrix3d();
        var i, j;
        
        for (i = 0; i < this.numRows; i++)
        {
            for (j = 0; j < this.numCols; j++)
            {
                temp.getMatrix()[i][j] = (m2.getMatrix()[i][0] * m1.getMatrix()[0][j]) + (m2.getMatrix()[i][1] * m1.getMatrix()[1][j]) + (m2.getMatrix()[i][2] * m1.getMatrix()[2][j]) + (m2.getMatrix()[i][3] * m1.getMatrix()[3][j]);
            }
        }
        
        for (i = 0; i < this.numRows; i++)
        {
            m1.getMatrix()[i][0] = temp.getMatrix()[i][0];
            m1.getMatrix()[i][1] = temp.getMatrix()[i][1];
            m1.getMatrix()[i][2] = temp.getMatrix()[i][2];
            m1.getMatrix()[i][3] = temp.getMatrix()[i][3];
        }
    };
    
    this.toString = function()
    {
    	return this.matrix.toString();
    }
    
    this.init();
};

/*
 * Th3dtran: Class for matrix manipuation.
 * ************************************************************
 */
Th3dtran = function()
{
    this.rMat;
    this.rMatrix;
    this.objectMatrix;

    this.init = function()
    {
        this.rMat = new Matrix3d();
        this.rMatrix = new Matrix3d();
        this.objectMatrix = new Matrix3d();

        this.initMatrix();
    };

    this.initMatrix = function()
    {
        this.objectMatrix.matrixIdentity();
    };

    this.translate = function(x, y, z)
    {
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[3][0] = x;
        this.rMat.getMatrix()[3][1] = y;
        this.rMat.getMatrix()[3][2] = z;
        
        this.objectMatrix.matrixCopy(this.rMat);
    };

    this.rotate = function(x, y, z)
    {
        var rx = x * (Math.PI/180.0);
        var ry = y * (Math.PI/180.0);
        var rz = z * (Math.PI/180.0);
        
        this.rMatrix.matrixIdentity();
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[1][1] = Math.cos(rx);
        this.rMat.getMatrix()[1][2] = Math.sin(rx);
        this.rMat.getMatrix()[2][1] = -(Math.sin(rx));
        this.rMat.getMatrix()[2][2] = Math.cos(rx);
        this.rMatrix.matrixMult(this.rMatrix, this.rMat);

        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = Math.cos(ry);
        this.rMat.getMatrix()[0][2] = -(Math.sin(ry));
        this.rMat.getMatrix()[2][0] = Math.sin(ry);
        this.rMat.getMatrix()[2][2] = Math.cos(ry);
        this.rMat.matrixMult(this.rMatrix, this.rMat);

        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = Math.cos(rz);
        this.rMat.getMatrix()[0][1] = Math.sin(rz);
        this.rMat.getMatrix()[1][0] = -(Math.sin(rz));
        this.rMat.getMatrix()[1][1] = Math.cos(rz);
        this.rMat.matrixMult(this.rMatrix, this.rMat);

        this.objectMatrix.matrixCopy(this.rMatrix);
    };

    this.scale = function(scale)
    {
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = scale;
        this.rMat.getMatrix()[1][1] = scale;
        this.rMat.getMatrix()[2][2] = scale;
        
        this.objectMatrix.matrixCopy(this.rMat);
    };

    this.transformPoint = function(p)
    {
        p.ax = (p.lx * this.objectMatrix.getMatrix()[0][0] + p.ly * this.objectMatrix.getMatrix()[1][0] + p.lz * this.objectMatrix.getMatrix()[2][0] + this.objectMatrix.getMatrix()[3][0]);
        p.ay = (p.lx * this.objectMatrix.getMatrix()[0][1] + p.ly * this.objectMatrix.getMatrix()[1][1] + p.lz * this.objectMatrix.getMatrix()[2][1] + this.objectMatrix.getMatrix()[3][1]);
        p.az = (p.lx * this.objectMatrix.getMatrix()[0][2] + p.ly * this.objectMatrix.getMatrix()[1][2] + p.lz * this.objectMatrix.getMatrix()[2][2] + this.objectMatrix.getMatrix()[3][2]);
        
        return p;
    };
    
    this.init();
};
