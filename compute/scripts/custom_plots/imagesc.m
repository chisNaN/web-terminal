function imagesc(varargin)
% imagesc Scale data and display as image.
%    USAGE:
%      image(C)
%      image(X,Y,C)
%      image(X,Y,C,'PropertyName',PropertyValue,...)
%      image('PropertyName',PropertyValue,...)
%      handle = image(...)
% 
%    imagesc(...) is the same as IMAGE(...) except the data is scaled
%    to use the full colormap.
%    
%    imagesc(...,CLIM) where CLIM = [CLOW CHIGH] can specify the
%    scaling.
% 
%    See also image, colorbar, imread, imwrite.

  if(nargin < 1) error('no arguments'); end
  if (nargin == 1)
    C = varargin{1};
    options = {};
  elseif (nargin == 3)
    x = varargin{1};
    y = varargin{2};
    C = varargin{3};
    options = {};
  elseif (mod(nargin, 2) == 1)
    clims = varargin{nargin};
    options = varargin(1:nargin-1);
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

  if (exist('clims', 'var'))
    if (not(all(size(clims) == [1 2])))
      error('clims should be a matrix of size [1 2]')
    end
    cmin = min(clims);
    cmax = max(clims);
  else
    if (not(size(size(C)) == 2))
      error('Color data should be a 2 dimensional matrix')
    end
    cmin = min(min(C));
    cmax = max(max(C));
  end

  colors = __interp_to_colormap__(C, cmin, cmax);

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
