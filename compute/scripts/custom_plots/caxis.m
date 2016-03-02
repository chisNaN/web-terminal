function caxis(varargin)
  % caxis controls the mapping of data values to the colormap. 
  % It affects any surfaces, patches, and images with indexed CData and CDataMapping set to scaled. 
  % It does not affect surfaces, patches, or images with true color CData or with CDataMapping set to direct.

  % USAGE

  % caxis([cmin cmax])
  % caxis auto
  % caxis manual
  % caxis(caxis) freeze
  % v = caxis
  % caxis(axes_handle,...)
  % 

  % 
  % caxis([cmin cmax]) sets the color limits to specified minimum and maximum values. 
  % Data values less than cmin or greater than cmax map to cmin and cmax, respectively. 
  % Values between cmin and cmax linearly map to the current colormap.
  % 
  % caxis auto computes the color limits automatically using the minimum and maximum data values. This is the default behavior. 
  % Color values set to Inf map to the maximum color, and values set to -Inf map to the minimum color. 
  % Faces or edges with color values set to NaN are not drawn.
  % 
  % caxis manual and caxis(caxis) freeze the color axis scaling at the current limits. 
  % This enables subsequent plots to use the same limits when hold is on.
  % 
  % v = caxis returns a two-element row vector containing the [cmin cmax] currently in use.
  % 
  % caxis(axes_handle,...) uses the axes specified by axes_handle instead of the current axes.
  % 
  % caxis changes the CLim and CLimMode properties of axes graphics objects.

  mode = '';
  minimum = 'null';
  maximum = 'null';
  if(nargin < 1) error('No arguments given'); end % Can't support this query in this manner, since stuff is stored client-side
  if (nargin == 1)
    if (strcmp(varargin{1}, 'auto'))
      mode = '"auto"';
    elseif (strcmp(varargin{1}, 'manual'))
      mode = '"manual"'; % need to check what this does, exactly
    elseif (all(size(varargin{1}) == [1 2]))
      mode = '"manual"';
      minimum = sprintf('%.0f', min(varargin{1}));
      maximum = sprintf('%.0f', max(varargin{1}));
    else
      error('Setting caxis currently not supported'); % can't support querying for mode either
    end
  elseif (nargin == 2)
    mode = '"manual"';
    minimum = sprintf('%.0f', min(cell2mat(varargin)));
    maximum = sprintf('%.0f', max(cell2mat(varargin)));
  else
   error('Too many arguments given');
  end

  __send_plot_message__('caxis', 'mode', mode, 'min', minimum, 'max', maximum);
end
