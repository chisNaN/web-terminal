function legend(varargin)
% LEGEND Display legend.
%    LEGEND(string1,string2,string3, ...) puts a legend on the current plot
%    using the specified strings as labels.
%
%    LEGEND(M), where M is a string matrix or cell array of strings, and
%
%    LEGEND OFF removes the legend from the current axes and deletes
%    the legend handle.
%
%    LEGEND TOGGLE toggles legend on or off.  If no legend exists for the
%    current axes one is created using default strings. The default
%    string for an object is the value of the DisplayName property
%    if it is non-empty and otherwise it is a string of the form
%    'data1','data2', etc.
%
%    LEGEND HIDE makes legend invisible.
%    LEGEND SHOW makes legend visible. If no legend exists for the
%    current axes one is created using default strings.
%
%    LEGEND BOXOFF  makes legend background box invisible when legend is
%    visible.
%    LEGEND BOXON makes legend background box visible when legend is visible.
%
%    LEGEND(...,'Location',LOC) adds a legend in the specified
%    location, LOC, with respect to the axes.  LOC may be either a
%    1x4 position vector or one of the following strings:
%
%        'ne'          inside top right (default for 2-D plots)
%        'nw'          inside top left
%        'se'          inside bottom right
%        'sw'          inside bottom left

if nargin == 1
  input = varargin{1};
  if ismatrix(input)
    newinput = {};
    for i = 1:size(input, 1)
      newinput{i} = input(i, :);
    end
    input = newinput;
  end
  __send_plot_message__('legend', 'args', __json_array__('"%s"', input{:}));
else
  __send_plot_message__('legend', 'args', __json_array__('"%s"', varargin{:}));
end


