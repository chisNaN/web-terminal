function clf(varargin)
% clf Clear current figure.
%    clf deletes all children of the current figure with visible handles.
% 
%    clf RESET deletes all children (including ones with hidden
%    handles) and also resets all figure properties, except Position,
%    Units, PaperPosition and PaperUnits, to their default values.
% 
%    clf(FIG) or clf(FIG,'RESET') clears the single figure with handle FIG.
% 
%    FIG_H = clf(...) returns the handle of the figure.
% 
%    See also cla, reset, hold.
%
%    Reference page in Help browser
%       doc clf


% if(nargin > 0) 
%   value = strcat('"', sprintf('%.0f', varargin{1}), '"');
% else
%   value = "null";
% end
% __send_plot_message__('clf', 'figure_id', value);
__send_plot_message__('clf');
