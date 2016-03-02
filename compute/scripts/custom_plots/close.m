function close(varargin)
  % close deletes the current figure or the specified figure(s). It optionally returns the status of the close operation.
  % 
  % close deletes the current figure (equivalent to close(gcf)).
  % 
  % close(h) deletes the figure identified by h. If h is a vector or matrix, close deletes all figures identified by h.
  % 
  % close name deletes the figure with the specified name.
  % 
  % close all deletes all figures whose handles are not hidden.
  % 
  % close all hidden deletes all figures including those with hidden handles.
  % 
  % close all force deletes all figures, including GUIs for which CloseRequestFcn has been altered to not close the window.
  % 
  % status = close(...) returns 1 if the specified windows have been deleted and 0 otherwise.

  figure_id = 'null';
  if(nargin < 1)
  elseif (nargin == 1)
    if ischar(varargin{1})
      figure_id = strcat('"', varargin{1}, '"');
    else
      figure_id = sprintf('%.0f', varargin{1});
    end
  else
   error('Too many arguments!');
  end

  __send_plot_message__('closefig', 'figure_id', figure_id);
end
