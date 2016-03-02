function zlim(varargin)
  % zlim with no arguments returns the limits of the current axes.
  % zlim([zmin zmax]) sets the axis limits in the current axes to the specified values.
  % zlim('mode') returns the current value of the axis limits mode, which can be either auto (the default) or manual.
  % zlim('auto') sets the axis limit mode to auto.
  % zlim('manual') sets the axis limit mode to manual.

  mode = '';
  minimum = 'null';
  maximum = 'null';
  if(nargin < 1) error('No arguments given'); end % Can't support this query in this manner, since stuff is stored client-side
  if (nargin == 1)
    if (strcmp(varargin{1}, 'auto'))
      mode = '"auto"';
    elseif (strcmp(varargin{1}, 'manual'))
      mode = '"manual"'; 
    elseif (all(size(varargin{1}) == [1 2]))
      mode = '"auto"';
      if ~isnan(varargin{1}(1))
        minimum = sprintf('%.0f', varargin{1}(1));
      end
      if ~isnan(varargin{1}(2))
        maximum = sprintf('%.0f', varargin{1}(2));
      end
    else
      error('Invalid input'); % can't support querying for mode either
    end
  else
   error('Too many arguments given');
  end

  __send_plot_message__('zlim', 'mode', mode, 'min', minimum, 'max', maximum);
end
