function loadfig(varargin)
  % purpose similar to hgload

  filepath = 'null';
  if(nargin < 1) error('No arguments given'); end % Can't support this query in this manner, since stuff is stored client-side
  if (nargin == 1)
    filepath = varargin{1};
  else
   error('Arguments besides filepath currently not supported');
  end

  __send_plot_message__('loadfig', 'path', strcat('"', filepath, '"'));

end
