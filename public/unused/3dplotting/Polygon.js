
/*
 * Polygon: This class represents a polygon on the surface plot.
 * ************************************************************
 */
Polygon = function(cameraPosition, type, index, fill)
{
    this.points = new Array();
    this.cameraPosition = cameraPosition;
    this.type = type;
    if (index == undefined) index = 0;
    this.index = index;  // Index in surfaces_points

    if (fill == undefined) {this.fill = true;}
    else {this.fill = fill;}

    this.centroid = null;
    this.color = null;
    this.distanceFromCamera = null;
    
    this.addPoint = function(point)
    {
        this.points[this.points.length] = point;
    };
    
    this.done = function()
    {
        var xCentre = 0;
        var yCentre = 0;
        var zCentre = 0;
        this.color = {red : 0, blue: 0, green: 0};
        
        var numPoints = this.points.length;
        
        for (var i = 0; i < numPoints; i++) {
            xCentre += this.points[i].ax;
            yCentre += this.points[i].ay;
            zCentre += this.points[i].az;
            this.color.red += this.points[i].color.red;
            this.color.green += this.points[i].color.green;
            this.color.blue += this.points[i].color.blue;
        }
        
        xCentre /= numPoints;
        yCentre /= numPoints;
        zCentre /= numPoints;
        this.color.red   = Math.round(this.color.red   / numPoints);
        this.color.green = Math.round(this.color.green / numPoints);
        this.color.blue  = Math.round(this.color.blue  / numPoints);
        
        this.centroid = new Point3D(xCentre, yCentre, zCentre);

        this.distanceFromCamera = euclidian_distance(this.cameraPosition, this.centroid);
    };
    
    this.getPoint = function(i)
    {
        return this.points[i];
    };
};

/*
 * PolygonComparator: Class used to sort arrays of polygons.
 * ************************************************************
 */
PolygonComparator = function(p1, p2)
{
    var diff = p1.distanceFromCamera - p2.distanceFromCamera;
    
    if (diff < 0)
        return -1;
    else if (diff > 0)
        return 1;
    else
        return 0;
};
