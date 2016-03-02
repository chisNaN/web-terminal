function scatter3(varargin)
%-- Function File:  surf (X, Y, Z)

% Syntax
% scatter3(X,Y,Z,S,C)
% scatter3(X,Y,Z)
% scatter3(X,Y,Z,S)
% scatter3(...,markertype)
% scatter3(...,'filled')
% scatter3(...,'PropertyName',propertyvalue)
% h = scatter3(...)
% 
% Description
% 
% scatter3(X,Y,Z,S,C) displays colored circles at the locations specified by the vectors X, Y, and Z (which must all be the same size).
% 
% S determines the area of each marker (specified in points^2). S can be a vector the same length as X, Y, and Z or a scalar. If S is a scalar, MATLAB draws all the markers the same size.
% 
% C determines the color of each marker. When C is a vector the same length as X and Y, the values in C are linearly mapped to the colors in the current colormap. When C is a 1-by-3 matrix, it specifies the colors of the markers as RGB values. If you have 3 points in the scatter plot and wish to have the colors be indices into the colormap, C should be a 3-by-1 matrix. C can also be a color string (see ColorSpec for a list of color string specifiers).
% 
% scatter3(X,Y,Z) draws the markers in the default size and color.
% 
% scatter3(X,Y,Z,S) draws markers at the specified sizes (S) in a single color.
% 
% scatter3(...,markertype) uses the marker type specified instead of 'o' (see LineSpec for a list of marker specifiers).
% 
% scatter3(...,'filled') fills the markers.
% 
% scatter3(...,'PropertyName',propertyvalue) creates the scatter graph, applying the specified property settings. See scattergroup properties for a description of properties.
% 
% h = scatter3(...) returns handles to the scattergroup objects created by scatter3. See Scattergroup Properties for property descriptions.

function [mat] = mat2jsonvec(mat)
  if (size(mat, 2) == 1)
    mat = mat';
  end
  mat = __mat2json__(mat);
end

if (nargin < 3) error ('Not enough arguments given'); end
x = mat2jsonvec(varargin{1});
y = mat2jsonvec(varargin{2});
z = mat2jsonvec(varargin{3});
s = 'null';
c = 'null';
if (nargin == 3)
elseif (nargin == 4)
  s = mat2jsonvec(varargin{4});
elseif (nargin == 5)
  s = mat2jsonvec(varargin{4});
  c = mat2jsonvec(varargin{5});
else
  error ('Too many arguments.  Properties not yet supported')
end

__send_plot_message__('loading');

__send_plot_message__( 'scatter3', 'x', x, 'y', y, 'z', z, 's', s, 'c', c);
end

