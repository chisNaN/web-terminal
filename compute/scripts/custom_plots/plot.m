function plot(varargin)

% plot   Linear plot. 
%    plot(X,Y) plots vector Y versus vector X. If X or Y is a matrix,
%    then the vector is plotted versus the rows or columns of the matrix,
%    whichever line up.  If X is a scalar and Y is a vector, disconnected
%    line objects are created and plotted as discrete points vertically at
%    X.
% 
%    plot(Y) plots the columns of Y versus their index.
%    If Y is complex, plot(Y) is equivalent to plot(real(Y),imag(Y)).
%    In all other uses of plot, the imaginary part is ignored.
% 
%    Various line types, plot symbols and colors may be obtained with
%    plot(X,Y,S) where S is a character string made from one element
%    from any or all the following 3 columns:
% 
%           b     blue          .     point              -     solid
%           g     green         o     circle             :     dotted
%           r     red           x     x-mark             -.    dashdot 
%           c     cyan          +     plus               --    dashed   
%           m     magenta       *     star             (none)  no line
%           y     yellow        s     square
%           k     black         d     diamond
%           w     white         v     triangle (down)
%                               ^     triangle (up)
%                               <     triangle (left)
%                               >     triangle (right)
%                               p     pentagram
%                               h     hexagram
%                          
%    For example, plot(X,Y,'c+:') plots a cyan dotted line with a plus 
%    at each data point; plot(X,Y,'bd') plots blue diamond at each data 
%    point but does not draw any line.
% 
%    plot(X1,Y1,S1,X2,Y2,S2,X3,Y3,S3,...) combines the plots defined by
%    the (X,Y,S) triples, where the X's and Y's are vectors or matrices 
%    and the S's are strings.  
% 
%    For example, plot(X,Y,'y-',X,Y,'go') plots the data twice, with a
%    solid yellow line interpolating green circles at the data points.
% 
%    The plot command, if no color is specified, makes automatic use of
%    the colors specified by the axes ColorOrder property.  By default,
%    plot cycles through the colors in the ColorOrder property.  For
%    monochrome systems, plot cycles over the axes LineStyleOrder property.
% 
%    Note that RGB colors in the ColorOrder property may differ from
%    similarly-named colors in the (X,Y,S) triples.  For example, the 
%    second axes ColorOrder property is medium green with RGB [0 .5 0],
%    while plot(X,Y,'g') plots a green line with RGB [0 1 0].
% 
%    If you do not specify a marker type, plot uses no marker. 
%    If you do not specify a line style, plot uses a solid line.
% 
%    plot(AX,...) plots into the axes with handle AX.
% 
%    plot returns a column vector of handles to lineseries objects, one
%    handle per plotted line. 
% 
%    The X,Y pairs, or X,Y,S triples, can be followed by 
%    parameter/value pairs to specify additional properties 
%    of the lines. For example, plot(X,Y,'LineWidth',2,'Color',[.6 0 0]) 
%    will create a plot with a dark red line width of 2 points.
% 
%    Example
%       x = -pi:pi/10:pi;
%       y = tan(sin(x)) - sin(tan(x));
%       plot(x,y,'--rs','LineWidth',2,...
%                       'MarkerEdgeColor','k',...
%                       'MarkerFaceColor','g',...
%                       'MarkerSize',10)
% 
%    See also plottools, semilogx, semilogy, loglog, plotyy, plot3, grid,
%    title, xlabel, ylabel, axis, axes, hold, legend, subplot, scatter.

  % TODO:  Add big plot check, and suggest to user to use big plot

  state = 0;
  message = {};
  propval = {};
  if(nargin < 1) error('Not enough input arguments.'); end
  for i=1:nargin
    i; % output
    state; %output
    switch(state)
    case 0
      if(isnumeric(varargin{i})) 
        % disp('matrix') % output
        message{end+1} = __mat2json__(varargin{i});
        state = 1;
      else
        error( sprintf( 'expected matrix for arg: %d', i));
      end
    case 1
      if(isnumeric(varargin{i}))
        % %disp('matrix') % output
        % verify that dimensions agree
        x = varargin{i-1};
        y = varargin{i};
        if(isvector(x) && isvector(y))
          if(length(x) != length(y)) 
            error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
          end
        elseif(isvector(x) && !isvector(y))
          if((length(x) != size(y,1)) && (length(x) != size(y,2))) 
            error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
          end
        elseif(!isvector(x) && isvector(y))
          if((length(y) != size(x,1)) && (length(y) != size(x,2))) 
            error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
          end
        else 
          if(!all(size(x)==size(y)))
            error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
          end
        end
        message{end+1} = __mat2json__(y);
        state = 2;

      elseif(ischar(varargin{i}))
        % check if it's a linespec
        [style color marker msg] = __parse_linespec__(varargin{i});
        if(isempty(msg)) 
          %disp('linespec')
          % is linespec
          state = 3;
          % append empty object for missing matrix
          message{end+1} = "null";
          message{end+1} = sprintf('[%s, %s, %s]', style, color, marker);
        else
          % done with triplet, add nulls
          message{end+1} = "null";
          message{end+1} = "null";
          %disp('property')
          % reading in prop/val pairs now
          state = 4;
          propval{end+1} = varargin{i};
        end
      else
        error('expected either linespec, property name, or matrix here');
      end
    case 2
      if(isnumeric(varargin{i}))
        %disp('matrix')
        % append empty object for missing linespec
        message{end+1} = "null";
        % append next matrix
        message{end+1} = __mat2json__(varargin{i});
        state = 1;
      elseif(ischar(varargin{i}))
        % check if it's a linespec
        [style color marker msg] = __parse_linespec__(varargin{i});
        if(isempty(msg)) 
          %%disp('linespec') %output
          % is linespec
          state = 3;
          message{end+1} = sprintf('[%s, %s, %s]', style, color, marker);
        else
          %disp('property')
          % missing linespec, append null
          message{end+1} = "null";
          % reading in prop/val pairs now
          state = 4;
          propval{end+1} = varargin{i};
        end
      else
        error('expected either linespec, property name, or matrix here');
      end
    case 3
      if(isnumeric(varargin{i}))
        %disp('matrix')
        message{end+1} = __mat2json__(varargin{i});
        state = 1;
      elseif(ischar(varargin{i}))
        [style color marker msg] = __parse_linespec__(varargin{i});
        if(isempty(msg)) 
          %disp('linespec')
          % is linespec. error!
          error( sprintf('unexpected linespec here for arg %d', i));
        else
          %disp('property')
          % reading in prop/val pairs now
          state = 4;
          propval{end+1} = varargin{i};
        end
      else
        error('expected either property name, or matrix here');
      end
    case 4
      if(isnumeric(varargin{i}))
        %disp('value:matrix')
        propval{end+1} = __mat2json__(varargin{i});
      elseif(ischar(varargin{i}))
        %disp('value:string')
        propval{end+1} = varargin{i};
      else
        error( sprintf('unexpected value, ignoring arg: %d', i));
      end
      state = 5;
    case 5
      if(!ischar(varargin{i})) error(sprintf('expected property at arg %d', i)); end
      propval{end+1} = varargin{i};
      state = 4;
    end
  end


  state;
  if(state == 1) 
    message{end+1} = "null";
    message{end+1} = "null";
    %message
  elseif(state == 2)
    message{end+1} = "null";
  elseif(state == 4 )
    error( sprintf('expected value for property: %s at %d', varargin{nargin}, nargin) ); 
  end
  
  json_series = strcat('[', sprintf( '%s, %s, %s,', message{:} ));
  json_series(size(json_series,2))= ']'; % remove last comma

  % TODO: don't assume the properties are strings...
  json_properties = strcat('{', sprintf( '"%s":"%s",', propval{:} ));
  json_properties(size(json_properties,2)) = '}';

  __send_plot_message__('loading');

  __send_plot_message__( 'plot', 'series', json_series, 'properties', json_properties);
end

