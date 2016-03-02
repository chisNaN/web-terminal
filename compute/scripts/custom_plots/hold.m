function hold(varargin)
% hold   Hold current graph
%    hold ON holds the current plot and all axis properties so that
%    subsequent graphing commands add to the existing graph.
%    hold OFF returns to the default mode whereby PLOT commands erase 
%    the previous plots and reset all axis properties before drawing 
%    new plots.
%    hold, by itself, toggles the hold state.
%    hold does not affect axis autoranging properties.
% 
%    hold ALL holds the plot and the current color and linestyle so
%    that subsequent plotting commands will not reset the color and
%    linestyle.
% 
%    hold(AX,...) applies the command to the Axes object AX.
% 
%    Algorithm note:
%    hold ON sets the NextPlot property of the current figure and
%    axes to "add".
%    hold OFF sets the NextPlot property of the current axes to
%    "replace".
% 
%    See also ishold, newplot, figure, axes.

if(nargin==0)
  value = '"toggle"';
else
  value = strcat('"', varargin{1}, '"');
end
__send_plot_message__('hold', 'value', value);
