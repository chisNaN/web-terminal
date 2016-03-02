function image(varargin)
% image  Display image.
%    USAGE:
%      image(C)
%      image(X,Y,C)
%      image(X,Y,C,'PropertyName',PropertyValue,...)
%      image('PropertyName',PropertyValue,...)
%      handle = image(...)
% 
%    image(C) displays matrix C as an image.  Each element of C
%    specifies the color of a rectilinear patch in the image.  C can be
%    a matrix of dimension MxN or MxNx3, and can contain double, uint8,
%    or uint16 data.
% 
%    When C is a 2-dimensional MxN matrix, the elements of C are used
%    as indices into the current COLORMAP to determine the color.  The
%    value of the image object's CDataMapping property determines the
%    method used to select a colormap entry.  For 'direct' CDataMapping
%    (the default), values in C are treated as colormap indices
%    (1-based if double, 0-based if uint8 or uint16).  For 'scaled' 
%    CDataMapping, values in C are first scaled according to the axes 
%    CLim and then the result is treated as a colormap index.  When C is
%    a 3-dimensional MxNx3 matrix, the elements in C(:,:,1) are
%    interpreted as red intensities, in C(:,:,2) as green intensities,
%    and in C(:,:,3) as blue intensities, and the CDataMapping property
%    of image is ignored.  For matrices containing doubles, color
%    intensities are on the range [0.0, 1.0].  For uint8 and uint16 
%    matrices, color intensities are on the range [0, 255].
% 
%    image(C) places the center of element C(1,1) at (1,1) in the axes,
%    and the center of element (M,N) at (M,N) in the axes, and draws
%    each rectilinear patch as 1 unit in width and height.  As a
%    result, the outer extent of the image occupies [0.5 N+0.5 0.5 M+0.5]
%    of the axes, and each pixel center of the image lies at integer
%    coordinates ranging between 1 and M or N.
% 
%    image(X,Y,C), where X and Y are vectors, specifies the locations
%    of the pixel centers of C(1,1) and C(M,N).  Element C(1,1) is
%    centered over (X(1), Y(1)), element C(M,N) is centered over
%    (X(end), Y(end)), and the pixel centers of the remaining elements
%    of C are spread out evenly between those two points, so that the
%    rectilinear patches are all of equal width and height.
% 
%    image returns a handle to an image object.
% 
%    C or the X,Y,C triple can be followed by property/value
%    pairs to specify additional properties of the image.
%    C or the X,Y,C triple can be omitted entirely, and all
%    properties specified using property/value pairs.
% 
%    image(...,'Parent',AX) specifies AX as the parent axes for the
%    image object during creation. 
% 
%    When called with C or X,Y,C, image sets the axes limits to tightly
%    enclose the image, sets the axes YDir property to 'reverse', and
%    sets the axes View property to [0 90].
% 
%    The image object will not render at axes View angles other than
%    [0 90].  To get a similar effect to rotating an image, use SURF
%    with texture mapping or PCOLOR.
% 
%    Execute GET(H), where H is an image handle, to see a list of image
%    object properties and their current values. Execute SET(H) to see a
%    list of image object properties and legal property values.
% 
%    See also imagesc, colormap, pcolor, surf, imread, imwrite.

  if(nargin < 1) error('No arguments given'); end
  if (nargin == 1)
    C = varargin{1};
    options = {};
  elseif (mod(nargin, 2) == 1)
    x = varargin{1};
    y = varargin{2};
    C = varargin{3};
    options = varargin(4:nargin);
  else
   options = varargin;
  end
  alpha = 1;

  for i=1:round(size(options,2)/2),
    property=options{2*i-1};
    value=options{2*i};
    if (strcmp(property,'CData'))
      C = value;
    elseif (strcmp(property,'XData'))
      x = value;
    elseif (strcmp(property,'YData'))
      y = value;
    elseif (strcmp(property,'Alpha'))
      alpha = value;
    elseif (strcmp(property,'AlphaData'))
      error('We only support a single transparency.  Please use the property "Alpha", with a single number in the interval [0, 1]');
    else
      % Most plausible and/or important to support:
      % CDataMapping
      % Clipping
      % DisplayName
      % Tag
      % Type
      % UserData
      % Visible
      error(strcat('Property "', property, '" not supported'));
    end
  end

  if (not(exist('C', 'var')))
    error('Need color data');
  end
  if (not(exist('x', 'var')))
    x = [1 size(C, 2)];
  end
  if (not(exist('y', 'var')))
    y = [1 size(C, 1)];
  end

  % Limits for the *centers* of the blocks
  xlow = x(1);
  xhigh = x(end);
  ylow = y(1);
  yhigh = y(end);

  if (numel(x) == 1)
    xhigh = xlow + size(C, 2) - 1;
  end
  if (numel(y) == 1)
    yhigh = ylow + size(C, 1) - 1;
  end

  if size(C, 3) == 3
    colors = uint8(C);
  else
    cmap = colormap();
    colors = __interp_to_colormap__(C, 1, size(cmap, 1));
  end

  symbols = ['a':'z' 'A':'Z' '0':'9'];
  length = 50;
  random_id = symbols(randi(numel(symbols),[1 length]));
  filename = strcat('/tmp/', random_id, '.png');
  %filename = strcat('.cloudlabs/figures/', sprintf('%.0f', evalin('base', 'gcf')), '.cfig/', random_id, '.jpg');

  %oldpath = pwd;
  %cd ~;
  imwrite(colors, filename);
  %cd(oldpath);

  __send_plot_message__('loading');

  __send_plot_message__('image', 'file', strcat('"', filename, '"'), ...
               'xlow', sprintf('%.0f', xlow), 'xhigh', sprintf('%.0f', xhigh), 'ylow', sprintf('%.0f', ylow), 'yhigh', sprintf('%.0f', yhigh), ...
               'alpha', sprintf('%.0f', alpha));
end
