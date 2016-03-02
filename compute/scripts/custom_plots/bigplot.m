function bigplot(varargin)

% bigplot   Plot of large, monotonic data.  
%    
%    bigplot(X,Y) plots vector Y versus vector X. 
%    If X is a string and Y is a string, the vectors of doubles are read 
%    (in binary) from the files denoted by the string.
% 
%    plot(Y) plots the columns of Y versus their index.
% 
%    Note that Y must be monotonic.
%    This function builds a data structure which is stored on our servers
%    and counts against your memory consumption until it is deleted.
%    The plot dynamically pulls data as you zoom and pan.
% 
%    Example
%       x = -pi:pi/10000000:pi;
%       y = tan(sin(x)) - sin(tan(x));
%       bigplot(x,y)
% 
%    See also plot.

  'Please be patient while your plot loads.'

  if (nargin == 0)
    error('No arguments given!');
  end

  symbols = ['a':'z' 'A':'Z' '0':'9'];
  length = 50;
  nums = randi(numel(symbols),[1 length]);
  filename_base = symbols(nums); 

  if (nargin == 3)
    y_adjust = strcat('"', varargin{3}, '"');
  else
    y_adjust = '"off"';
  end

  if (ischar(varargin{1}))
    x_in = file_in_path('.', varargin{1});
    y_in = file_in_path('.', varargin{2});
  else
    if (nargin == 1)
      y = varargin{1};
      x = 1 : size(y, 2);
    else
      x = varargin{1};
      y = varargin{2};
    end

    if((size(size(x), 2) != 2) || (size(size(y), 2) != 2)) 
      error('Incorrect dimensions.  Bigplot only supports one plot at a time');
    end
    if((min(size(x)) != 1) || (min(size(y)) != 1)) 
      error('Incorrect dimensions.  Bigplot only supports one plot at a time');
    end
    n = max(size(y));
    if (max(size(x)) != n)
      error('Dimensions of x and y do not match')
    end


    x_in = strcat('/tmp/', filename_base, '_x');
    input_file = fopen(x_in, 'w');
    fwrite(input_file, x, 'double');
    fclose(input_file);

    y_in = strcat('/tmp/', filename_base, '_y');
    input_file = fopen(y_in, 'w');
    fwrite(input_file, y, 'double');
    fclose(input_file);
  end

  __send_plot_message__('loading');
  __send_plot_message__( 'big_mono_plot', 'id', strcat('"', filename_base , '"'),
               'x_in', strcat('"', x_in, '"'), 'y_in', strcat('"', y_in, '"'),
              'y_adjust', y_adjust
  );
  %              'properties', strcat('{', sprintf( '%s:%s,', propval{:} ), '}') );

end

  % then pass it to javascript
  % convert arguments to a javascript list
  %state = 0;
  %message = {};
  %propval = {};
  %if(nargin < 1) error('no arguments'); end
  %for i=1:nargin
  %  i; % output
  %  state; %output
  %  switch(state)
  %  case 0
  %    if(isnumeric(varargin{i})) 
  %      % disp('matrix') % output
  %      message{end+1} = __mat2json__(varargin{i});
  %      state = 1;
  %    else
  %      error( sprintf( 'expected matrix for arg: %d', i));
  %    end
  %  case 1
  %    if(isnumeric(varargin{i}))
  %      % %disp('matrix') % output
  %      % verify that dimensions agree
  %      x = varargin{i-1};
  %      y = varargin{i};
  %      if(isvector(x) && isvector(y))
  %        if(length(x) != length(y)) 
  %          error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
  %        end
  %      elseif(isvector(x) && !isvector(y))
  %        if((length(x) != size(y,1)) && (length(x) != size(y,2))) 
  %          error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
  %        end
  %      elseif(!isvector(x) && isvector(y))
  %        if((length(y) != size(x,1)) && (length(y) != size(x,2))) 
  %          error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
  %        end
  %      else 
  %        if(!all(size(x)==size(y)))
  %          error(sprintf('dimension of arg %d {%d x %d} as x does not match arg %d  {%d x %d} as y', i-1, size(x), i, size(y)));
  %        end
  %      end
  %      message{end+1} = __mat2json__(y);
  %      state = 2;

  %    elseif(ischar(varargin{i}))
  %      % check if it's a linespec
  %      [style color marker msg] = __parse_linespec__(varargin{i});
  %      if(isempty(msg)) 
  %        %disp('linespec')
  %        % is linespec
  %        state = 3;
  %        % append empty object for missing matrix
  %        message{end+1} = "null";
  %        message{end+1} = sprintf('[%s, %s, %s]', style, color, marker);
  %      else
  %        % done with triplet, add nulls
  %        message{end+1} = "null";
  %        message{end+1} = "null";
  %        %disp('property')
  %        % reading in prop/val pairs now
  %        state = 4;
  %        propval{end+1} = varargin{i};
  %      end
  %    else
  %      error('expected either linespec, property name, or matrix here');
  %    end
  %  case 2
  %    if(isnumeric(varargin{i}))
  %      %disp('matrix')
  %      % append empty object for missing linespec
  %      message{end+1} = "null";
  %      % append next matrix
  %      message{end+1} = __mat2json__(varargin{i});
  %      state = 1;
  %    elseif(ischar(varargin{i}))
  %      % check if it's a linespec
  %      [style color marker msg] = __parse_linespec__(varargin{i});
  %      if(isempty(msg)) 
  %        %%disp('linespec') %output
  %        % is linespec
  %        state = 3;
  %        message{end+1} = sprintf('[%s, %s, %s]', style, color, marker);
  %      else
  %        %disp('property')
  %        % missing linespec, append null
  %        message{end+1} = "null";
  %        % reading in prop/val pairs now
  %        state = 4;
  %        propval{end+1} = varargin{i};
  %      end
  %    else
  %      error('expected either linespec, property name, or matrix here');
  %    end
  %  case 3
  %    if(isnumeric(varargin{i}))
  %      %disp('matrix')
  %      message{end+1} = __mat2json__(varargin{i});
  %      state = 1;
  %    elseif(ischar(varargin{i}))
  %      [style color marker msg] = __parse_linespec__(varargin{i});
  %      if(isempty(msg)) 
  %        %disp('linespec')
  %        % is linespec. error!
  %        error( sprintf('unexpected linespec here for arg %d', i));
  %      else
  %        %disp('property')
  %        % reading in prop/val pairs now
  %        state = 4;
  %        propval{end+1} = varargin{i};
  %      end
  %    else
  %      error('expected either property name, or matrix here');
  %    end
  %  case 4
  %    if(isnumeric(varargin{i}))
  %      %disp('value:matrix')
  %      propval{end+1} = __mat2json__(varargin{i});
  %    elseif(ischar(varargin{i}))
  %      %disp('value:string')
  %      propval{end+1} = varargin{i};
  %    else
  %      error( sprintf('unexpected value, ignoring arg: %d', i));
  %    end
  %    state = 5;
  %  case 5
  %    if(!ischar(varargin{i})) error(sprintf('expected property at arg %d', i)); end
  %    propval{end+1} = varargin{i};
  %    state = 4;
  %  end
  %end


  %state;
  %if(state == 1) 
  %  message{end+1} = "null";
  %  message{end+1} = "null";
  %  %message
  %elseif(state == 2)
  %  message{end+1} = "null";
  %elseif(state == 4 )
  %  error( sprintf('expected value for property: %s at %d', varargin{nargin}, nargin) ); 
  %end
  %

  %if (size(message, 2) > 3)
  %  'Bigplot currently only supports one plot at a time.'
  %end
  %
