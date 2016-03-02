function surf(varargin)
%-- Function File:  surf (X, Y, Z)

% surf(Z) creates a three-dimensional shaded surface from the z components in matrix Z, using x = 1:n and y = 1:m, where [m,n] = size(Z). 
% The height, Z, is a single-valued function defined over a geometrically rectangular grid. Z specifies the color data, as well as surface height, so color is proportional to surface height.
%
% surf(Z,C) plots the height of Z, a single-valued function defined over a geometrically rectangular grid, and uses matrix C, assumed to be the same size as Z, to color the surface.
%
% surf(X,Y,Z) uses Z for the color data and surface height. X and Y are vectors or matrices defining the x and y components of a surface. 
% If X and Y are vectors, length(X) = n and length(Y) = m, where [m,n] = size(Z). In this case, the vertices of the surface faces are (X(j), Y(i), Z(i,j)) triples. 
% To create X and Y matrices for arbitrary domains, use the meshgrid function.
%
% surf(X,Y,Z,C) uses C to define color. MATLAB performs a linear transformation on this data to obtain colors from the current colormap.
%
% surf(...,'PropertyName',PropertyValue) specifies surface Surfaceplot along with the data.
%
% surf(axes_handles,...) plots into the axes with handle axes_handle instead of the current axes (gca).
%
% h = surf(...) returns a handle to a Surfaceplot graphics object.

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
__send_plot_message__( 'surf', 'x', xx, 'y', yy, 'z', zz, 'c', c);
end

