function subplot(varargin)
% subplot Create axes in tiled positions.
%    H = subplot(m,n,p), or subplot(mnp), breaks the Figure window
%    into an m-by-n matrix of small axes, selects the p-th axes for
%    the current plot, and returns the axes handle.  The axes are
%    counted along the top row of the Figure window, then the second
%    row, etc.  For example,
% 
%        subplot(2,1,1), PLOT(plot1)
%        subplot(2,1,2), PLOT(plot2)
% 
%    plots plot1 on the top half of the window and plot2 on the
%    bottom half. If the CurrentAxes is nested in a uipanel the
%    panel is used as the parent for the subplot instead of the
%    current figure.
% 
%    subplot(m,n,p), if the axes already exists, makes it current.
%    subplot(m,n,p,'replace'), if the axes already exists, deletes it and
%    creates a new axes.
%    subplot(m,n,p,'align') places the axes so that the plot boxes
%    are aligned, but does not prevent the labels and ticks from
%    overlapping.
%    subplot(m,n,P), where P is a vector, specifies an axes position
%    that covers all the subplot positions listed in P.
%    subplot(H), where H is an axes handle, is another way of making
%    an axes current for subsequent plotting commands.
% 
%    subplot('position',[left bottom width height]) creates an
%    axes at the specified position in normalized coordinates (in
%    in the range from 0.0 to 1.0).
% 
%    subplot(..., PROP1, VALUE1, PROP2, VALUE2, ...) sets the
%    specified property-value pairs on the subplot axes. To add the
%    subplot to a specific figure pass the figure handle as the
%    value for the 'Parent' property.
% 
%    If a subplot specification causes a new axes to overlap an
%    existing axes, the existing axes is deleted - unless the position
%    of the new and existing axes are identical.  For example,
%    the statement subplot(1,2,1) deletes all existing axes overlapping
%    the left side of the Figure window and creates a new axes on that
%    side - unless there is an axes there with a position that exactly
%    matches the position of the new axes (and 'replace' was not specified),
%    in which case all other overlapping axes will be deleted and the
%    matching axes will become the current axes.
% 
%    subplot(111) is an exception to the rules above, and is not
%    identical in behavior to subplot(1,1,1).  For reasons of backwards
%    compatibility, it is a special case of subplot which does not
%    immediately create an axes, but instead sets up the figure so that
%    the next graphics command executes CLF RESET in the figure
%    (deleting all children of the figure), and creates a new axes in
%    the default position.  This syntax does not return a handle, so it
%    is an error to specify a return argument.  The delayed CLF RESET
%    is accomplished by setting the figure's NextPlot to 'replace'.
% 
%    Be aware when creating subplots from scripts that the Position
%    property of subplots is not finalized until either a drawnow
%    command is issued, or MATLAB returns to await a user command.
%    That is, the value obtained for subplot i by the command
%    get(h(i),'Position') will not be correct until the script
%    refreshes the plot or exits.
% 
%    See also  gca, gcf, axes, figure, uipanel

if(nargin==3)
  m = varargin{1};
  n = varargin{2};
  p = varargin{3};
  if ((p > n * m) || (p < 1))
    error('p out of range.  Should be between 1 and m*n, inclusive.');
  end
else
  error('Currently, extra arguments not supported');
end

__send_plot_message__('subplot', 'm', sprintf('%.0f', m), 'n', sprintf('%.0f', n), 'p', sprintf('%.0f', p));
