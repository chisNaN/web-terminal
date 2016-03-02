/*
 * Transformation3d: Class for matrix manipuation.
 * ************************************************************
 */
Transformation3d = function()
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
    
    this.ChangeObjectPoint = function(p)
    {
        p.ax = (p.lx * this.objectMatrix.getMatrix()[0][0] + p.ly * this.objectMatrix.getMatrix()[1][0] + p.lz * this.objectMatrix.getMatrix()[2][0] + this.objectMatrix.getMatrix()[3][0]);
        p.ay = (p.lx * this.objectMatrix.getMatrix()[0][1] + p.ly * this.objectMatrix.getMatrix()[1][1] + p.lz * this.objectMatrix.getMatrix()[2][1] + this.objectMatrix.getMatrix()[3][1]);
        p.az = (p.lx * this.objectMatrix.getMatrix()[0][2] + p.ly * this.objectMatrix.getMatrix()[1][2] + p.lz * this.objectMatrix.getMatrix()[2][2] + this.objectMatrix.getMatrix()[3][2]);
        
        return p;
    };
    
    this.init();
};
