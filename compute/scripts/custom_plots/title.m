function title(varargin)
% title  Graph title.
%    title('text') adds text at the top of the current axis.
% 
%    title('text','Property1',PropertyValue1,'Property2',PropertyValue2,...)
%    sets the values of the specified properties of the title.
% 
%    title(AX,...) adds the title to the specified axes.
% 
%    H = title(...) returns the handle to the text object used as the title.
% 
%    See also xlabel, ylabel, zlabel, text.

  if(nargin < 1) error('No arguments given'); end
  if (nargin == 1)
    label = varargin{1};
    options = {};
  elseif (mod(nargin, 2) == 1)
    label = varargin{1};
    options = varargin(2:nargin);
  else
   error('Invalid number of arguments');
  end

  font = 'Helvetica';
  color = 'black'; % NOT CURRENTLY USED
  fontsize = 12;

  for i=1:round(size(options,2)/2),
    property=options{2*i-1};
    value=options{2*i};
    if (strcmp(property,'String'))
      label = value;
    elseif (strcmp(property,'Color'))
      if all(class(a) == 'char')
        color = value;
      else
        error('Currently, only default colors are provided');
      end
    elseif (strcmp(property,'FontName'))
      font = value;
    elseif (strcmp(property,'FontSize'))
      fontsize = value;
    else
      % Most plausible and/or important to support:
      % Background color
      % Clipping
      % Color
      % DisplayName .. for legend
      % FontAngle
      % FontWeight
      % FontUnits
      % LineStyle
      % LineWidth
      % Margin
      % Position
      % Units
      error(strcat('Property "', property, '" not supported'));
    end
  end

  __send_plot_message__('title', 'label', strcat('"',label,'"'),
               'font', strcat('"', font, '"'),
               'fontsize', sprintf('%.0f', fontsize)
              );
end
