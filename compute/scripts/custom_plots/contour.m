function contour(varargin)
%contour Contour plot.
% 
%  Usage:
%     contour(Z)
%     contour(Z,n)
%     contour(Z,v)
%     contour(X,Y,Z)
%     contour(X,Y,Z,n)
%     contour(X,Y,Z,v)
% 
%  contour(Z) is a contour plot of matrix Z treating the values in Z
%  as heights above a plane.  A contour plot are the level curves
%  of Z for some values V.  The values V are chosen automatically.
%
%  contour(X, Y, Z) X and Y specify the (x, y) coordinates of the
%  surface as for SURF. The X and Y data will be transposed or sorted
%  to bring it to MESHGRID form depending on the span of the first
%  row and column of X (to orient the data) and the order of the
%  first row of X and the first column of Y (to sorted the data). The
%  X and Y data must be consistently sorted in that if the first
%  element of a column of X is larger than the first element of
%  another column that all elements in the first column are larger
%  than the corresponding elements of the second. Similarly Y must be
%  consistently sorted along rows.
%
%  contour(Z, N) and contour(X, Y, Z, N) draw N contour lines,
%  overriding the automatic value.
%
%  contour(Z, V) and contour(X, Y, Z, V) draw LENGTH(V) contour lines
%  at the values specified in vector V.  Use contour(Z, [v, v]) or
%
%  contour(X, Y, Z, [v, v]) to compute a single contour at the level v.
%
%  contour(AX, ...) plots into AX instead of GCA.
%
%  [C, H] = contour(...) returns contour matrix C as described in
%  CONTOURC and a handle H to a contourgroup object.  This handle can
%  be used as input to CLABEL.
%
%  The contours are normally colored based on the current colormap
%  and are drawn as PATCH objects. You can override this behavior
%  with the syntax contour(..., LINESPEC) to draw the contours
%  with the color and linetype specified. See the help for PLOT
%  for more information about LINESPEC values.
%
%  The above inputs to contour can be followed by property/value
%  pairs to specify additional properties of the contour object.
%
%  Uses code by R. Pawlowicz to handle parametric surfaces and
%  inline contour labels.
%
%  Example:
%     [c, h] = contour(peaks); clabel(c, h); colorbar;
%
%  See also contour3, contourf, clabel, colorbar, meshgrid.

%  Overloaded methods:
%     gpuArray/contour

%  Reference page in Help browser
%     doc contour

if(nargin==0)
  error('Not enough input arguments.');
end

n = 10;

if(nargin<3) 
  Z = varargin{1};
  [X, Y] = meshgrid(1:size(Z, 1), 1:size(Z,2));
  if (nargin == 1)
    V = get_values(Z, n);
  else
    if (length(varargin{2}) == 1)
      n = varargin{2};
      V = get_values(Z, n);
    else
      assert(isvector(varargin{2}), 'Invalid second input.  Should be a vector of contour values, or a number indicating the number of contour values to assign automatically.');
      V = varargin{2};
    end
  end
else
  X = varargin{1};
  Y = varargin{2};
  Z = varargin{3};

  assert(ismatrix(X), 'Invalid X input.  Should be a vector of length size(Z, 2) or a matrix with same size as Z');
  assert(ismatrix(Y), 'Invalid Y input.  Should be a vector of length size(Z, 1) or a matrix with same size as Z');

  if (~(all(size(X) == size(Z)) & all(size(Y) == size(Z))))
    assert(isvector(X) & (length(X) == size(Z,2)), 'Invalid X input.  Should be a vector of length size(Z, 2) or a matrix with same size as Z');
    assert(isvector(Y) & (length(Y) == size(Z,1)), 'Invalid Y input.  Should be a vector of length size(Z, 1) or a matrix with same size as Z');
    [X, Y] = meshgrid(X, Y);
  end

  if(nargin==3)
    V = get_values(Z, n);
  elseif(nargin==4)
    if (length(varargin{4}) == 1)
      n = varargin{4};
      V = get_values(Z, n);
    else
      assert(isvector(varargin{4}), 'Invalid fourth input.  Should be a vector of contour values, or a number indicating the number of contour values to assign automatically.');
      V = varargin{4};
    end
  else
    error('Too many input arguments.  Linespec and axes_handle currently not supported.');
  end
end

assert(ismatrix(Z), 'Invalid input.  Z should be a matrix.');
assert(all(size(Z) > [1, 1]), 'Z must be at least a 2 by 2 matrix.');
assert(all(size(Z) == size(X)), 'Error.  Dimensions mismatch.');
assert(all(size(Z) == size(Y)), 'Error.  Dimensions mismatch.');

% should this happen?
V = sort(V);
C = squeeze(__interp_to_colormap__(V));

__send_plot_message__('loading');
__send_plot_message__('contour', 'X', __mat2json__(X),
                                 'Y', __mat2json__(Y),
                                 'Z', __mat2json__(Z),
                                 'V', __mat2json__(V),
                                 'C', __mat2json__(C)
                     );

end

function [V] = get_values(Z, n)
  maxval = max(max(Z));
  minval = min(min(Z));
  if (maxval == minval)
    warning('Contour not rendered for constant data');
  end
  % maybe shouldn't take on the extremal values?
  V = (0:n-1) * ((maxval - minval) / (n-1)) + minval;
  %assert(length(V) == n, 'Something went wrong internally. V has incorrect length.');
end
