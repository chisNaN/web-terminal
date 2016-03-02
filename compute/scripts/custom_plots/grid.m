function grid(varargin)
% grid   Grid lines.
%    grid ON adds major grid lines to the current axes.
%    grid OFF removes major and minor grid lines from the current axes. 
%    grid MINOR toggles the minor grid lines of the current axes.
%    grid, by itself, toggles the major grid lines of the current axes.
%    grid(AX,...) uses axes AX instead of the current axes.
% 
%    grid sets the XGrid, YGrid, and ZGrid properties of
%    the current axes.
% 
%    set(AX,'XMinorGrid','on') turns on the minor grid.
% 
%    See also title, xlabel, ylabel, zlabel, axes, plot, box.

if(nargin==0)
  value = '"toggle"';
else
  value = strcat('"', varargin{1}, '"');
end
__send_plot_message__('grid', 'value', value);

