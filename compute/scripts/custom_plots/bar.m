function bar(x,y,width)
% bar Bar graph.
%    bar(X,Y) draws the columns of the M-by-N matrix Y as M groups of N
%    vertical bars.  The vector X must not have duplicate values.
% 
%    bar(Y) uses the default value of X=1:M.  For vector inputs, bar(X,Y)
%    or bar(Y) draws LENGTH(Y) bars.  The colors are set by the colormap.
% 
%    bar(X,Y,WIDTH) or bar(Y,WIDTH) specifies the width of the bars. Values
%    of WIDTH > 1, produce overlapped bars.  The default value is WIDTH=0.8
% 
%    bar(...,'grouped') produces the default vertical grouped bar chart.
%    bar(...,'stacked') produces a vertical stacked bar chart.
%    bar(...,LINESPEC) uses the line color specified (one of 'rgbymckw').
% 
%    bar(AX,...) plots into AX instead of GCA.
% 
%    H = bar(...) returns a vector of handles to barseries objects.
% 
%    Use SHADING FACETED to put edges on the bars.  Use SHADING FLAT to
%    turn them off.
% 
%    Examples: subplot(3,1,1), bar(rand(10,5),'stacked'), colormap(cool)
%              subplot(3,1,2), bar(0:.25:1,rand(5),1)
%              subplot(3,1,3), bar(rand(2,3),.75,'grouped')
% 
%    See also hist, plot, barh, bar3, bar3h.
%
%    Overloaded methods:
%       gpuArray/bar
%       fints/bar
%
%    Reference page in Help browser
%       doc bar

if(nargin==0)
  error('Not enough input arguments.');
end

if(nargin==1) 
  y = x;
  x = 1:length(y);
end

if(nargin<3)
  width = .8;
end

if(length(x) ~= length(y)) 
  error('x and y do not agree in size');
end

% TODO MAKE MAT2JSON TAKE EXTRA ARGS INSTEAD OF DOING THIS
header = sprintf('{ "rows": %d, "cols": %d, "barWidth": %f, "data":[', length(x), 2, width);
X = [x(:); y(:)];
data = sprintf('%g,', X);
data(size(data,2))=[]; % remove last comma
footer = ']}';
% replace NaN with null
txt = strrep( strcat(header,data,footer), "Inf", "Infinity");

__send_plot_message__('loading');

__send_plot_message__('bars', 'data', txt );

end
