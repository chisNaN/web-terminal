function zoom(varargin)
% zoom - Turn zooming on or off or magnify by factor
% 
% USAGE: 
%   zoom on
%   zoom off
%   zoom out
%   zoom reset
%   zoom
%   zoom xon
%   zoom yon
%   zoom(factor)
%   zoom(fig, option)
%   h = zoom(figure_handle)
% 
% zoom on turns on interactive zooming. When interactive zooming is enabled in a figure, pressing a mouse button while your cursor is within an axes zooms into the point or out from the point beneath the mouse. Zooming changes the axes limits. When using zoom mode, you
% 
% Zoom in by positioning the mouse cursor where you want the center of the plot to be and either
% Press the mouse button or rotate the mouse scroll wheel away from you (upward).
% Zoom out by positioning the mouse cursor where you want the center of the plot to be and either
% Simultaneously press Shift and the mouse button, or
% Rotate the mouse scroll wheel toward you (downward).
% Each mouse click or scroll wheel click zooms in or out by a factor of 2.
% 
% Clicking and dragging over an axes when zooming in is enabled draws a rubberband box. When you release the mouse button, the axes zoom in to the region enclosed by the rubberband box.
% 
% Double-clicking over an axes returns the axes to its initial zoom setting in both zoom-in and zoom-out modes.
% 
% zoom off turns interactive zooming off.
% 
% zoom out returns the plot to its initial zoom setting.
% 
% zoom reset remembers the current zoom setting as the initial zoom setting. Later calls to zoom out, or double-clicks when interactive zoom mode is enabled, will return to this zoom level.
% 
% zoom toggles the interactive zoom status between off and on (restoring the most recently used zoom tool).
% 
% zoom xon and zoom yon set zoom on for the x- and y-axis, respectively.
% 
% zoom(factor) zooms in or out by the specified zoom factor, without affecting the interactive zoom mode. Values greater than 1 zoom in by that amount, while numbers greater than 0 and less than 1 zoom out by 1/factor.
% 
% zoom(fig, option) Any of the preceding options can be specified on a figure other than the current figure using this syntax.
% 
% h = zoom(figure_handle) returns a zoom mode object for the figure figure_handle for you to customize the mode's behavior.

if(nargin==0)
  value = '"toggle"';
else
  value = strcat('"', varargin{1}, '"');
end
__send_plot_message__('zoom', 'value', value);
