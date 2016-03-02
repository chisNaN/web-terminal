function mesh(varargin)

% mesh   3-D mesh surface.
%    mesh(X,Y,Z,C) plots the colored parametric mesh defined by
%    four matrix arguments.  The view point is specified by VIEW.
%    The axis labels are determined by the range of X, Y and Z,
%    or by the current setting of AXIS.  The color scaling is determined
%    by the range of C, or by the current setting of CAXIS.  The scaled
%    color values are used as indices into the current COLORMAP.
% 
%    mesh(X,Y,Z) uses C = Z, so color is proportional to mesh height.
% 
%    mesh(x,y,Z) and mesh(x,y,Z,C), with two vector arguments replacing
%    the first two matrix arguments, must have length(x) = n and
%    length(y) = m where [m,n] = size(Z).  In this case, the vertices
%    of the mesh lines are the triples (x(j), y(i), Z(i,j)).
%    Note that x corresponds to the columns of Z and y corresponds to
%    the rows.
% 
%    mesh(Z) and mesh(Z,C) use x = 1:n and y = 1:m.  In this case,
%    the height, Z, is a single-valued function, defined over a
%    geometrically rectangular grid.
% 
%    mesh(...,'PropertyName',PropertyValue,...) sets the value of
%    the specified surface property.  Multiple property values can be set
%    with a single statement.
% 
%    mesh(AX,...) plots into AX instead of GCA.
% 
%    mesh returns a handle to a surface plot object.
% 
%    AXIS, CAXIS, COLORMAP, HOLD, SHADING, HIDDEN and VIEW set figure,
%    axes, and surface properties which affect the display of the mesh.
% 
%    See also surf, meshc, meshz, waterfall.
%-- Function File:  mesh (X, Y, Z)
%    Plot a mesh given matrices X, and Y from `meshgrid' and a matrix Z
%    corresponding to the X and Y coordinates of the mesh.  If X and Y
%    are vectors, then a typical vertex is (X(j), Y(i), Z(i,j)).  Thus,
%    columns of Z correspond to different X values and rows of Z
%    correspond to different Y values.
%    See also: meshgrid, contour

if (nargin < 1) error ('Not enough input arguments.'); end
if (nargin == 1)
  zz = varargin{1};
  xx = 'null';
  yy = 'null';
  c = 'null';
elseif (nargin == 2)
  zz = varargin{1};
  xx = 'null';
  yy = 'null';
  c = __mat2json__(varargin{2});
elseif (nargin == 3)
  xx = varargin{1};
  yy = varargin{2};
  zz = varargin{3};
  c = 'null';
elseif (nargin == 4)
  xx = varargin{1};
  yy = varargin{2};
  zz = varargin{3};
  c = __mat2json__(varargin{4});
else
  error ('Too many arguments.  Properties not yet supported')
end

% detect if columns of x are the same, or rows of y are the same, and if so
% compress it by sending one column and one row (client will expand it)
if ~isequal(xx, 'null')
  if(all(all(xx==repmat(xx(1,:),size(xx,1),1))))
    xx = xx(1,:);
  end
  if(all(all(yy==repmat(yy(:,1),1, size(yy,2))))) 
    yy = yy(:,1);
  end
  xx = __mat2json__(xx);
  yy = __mat2json__(yy);
end

zz = __mat2json__(zz);

__send_plot_message__('loading');
__send_plot_message__( 'mesh', 'x', xx, 'y', yy, 'z', zz, 'c', c);
end

