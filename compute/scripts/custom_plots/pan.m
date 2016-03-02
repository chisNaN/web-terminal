function pan(varargin)
% pan - Interactively pan the view of a plot
% 
% USAGE:
%   pan on
%   pan xon
%   pan yon
%   pan off
%   pan
%   pan(figure_handle,...)
%   h = pan(figure_handle)
% 
% pan on turns on mouse-based panning in the current figure.
% 
% pan xon turns on panning only in the x direction in the current figure.
% 
% pan yon turns on panning only in the y direction in the current figure.
% 
% pan off turns panning off in the current figure.
% 
% pan toggles the pan state in the current figure on or off.
% 
% pan(figure_handle,...) sets the pan state in the specified figure.
% 
% h = pan(figure_handle) returns the figure's pan mode object for the figure figure_handle for you to customize the mode's behavior.

if(nargin==0)
  value = '"toggle"';
else
  value = strcat('"', varargin{1}, '"');
end
__send_plot_message__('pan', 'value', value);
