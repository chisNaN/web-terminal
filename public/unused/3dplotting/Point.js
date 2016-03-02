
/*
 * Point: A simple 2D point.
 * ************************************************************
 */
Point = function(x, y)
{
    this.x = x;
    this.y = y;
};


/**
* Given two coordinates, return the Euclidean distance
* between them
*/
function distance(p1, p2)
{
    return Math.sqrt(((p1.x - p2.x) * (p1.x - 
        p2.x)) + ((p1.y - p2.y) * (p1.y - p2.y)));
}


/*
 * Point3D: This class represents a 3D point.
 * ******************************************
 */
Point3D = function(x, y, z, color, size, text, font)
{
    this.displayValue = "";

    this.lx;
    this.ly;
    this.lz;
    this.lt;

    this.color;
    this.size;

    this.text = text;
    this.font = font;
    
    this.wx;
    this.wy;
    this.wz;
    this.wt;
    
    this.ax;
    this.ay;
    this.az;
    this.at;
    
    this.dist;

    this.initPoint = function()
    {
        this.lx = this.ly = this.lz = this.ax = this.ay = this.az = this.at = this.wx = this.wy = this.wz = 0;
        this.lt = this.wt = 1;
        this.color = 0;
    };
    
    this.init = function(x, y, z, color)
    {
        this.initPoint();
        this.lx = x;
        this.ly = y;
        this.lz = z;

        if (!color) { this.color = {red: 0, green: 0, blue: 0}; }
        else { this.color = color; }

        this.size = (size === undefined) ? 5 : size;

        this.ax = this.lx;
        this.ay = this.ly;
        this.az = this.lz;
    };

    this.init(x, y, z, color);
};

euclidian_distance = function(p1, p2)
{
    return ((p1.ax-p2.ax)*(p1.ax-p2.ax))+((p1.ay-p2.ay)*(p1.ay-p2.ay))+((p1.az-p2.az)*(p1.az-p2.az));
};
