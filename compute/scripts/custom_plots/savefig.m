function savefig(varargin)
  % purpose similar to hgsave

  filepath = 'null';
  figure_id = 'null';
  if(nargin < 1) error('No arguments given'); end % Can't support this query in this manner, since stuff is stored client-side
  if (nargin == 1)
    filepath = strcat('"', varargin{1}, '"');
  elseif (nargin == 2)
    figure_id = sprintf('%.0f', varargin{1});
    filepath = strcat('"', varargin{2}, '"');
  else
   error('Too many arguments given');
  end

  __send_plot_message__('savefig', 'filepath', filepath, 'figure_id', figure_id);
end
