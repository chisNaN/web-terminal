function ylabel(varargin)
% ylabel Y-axis label.
%    ylabel('text') adds text beside the Y-axis on the current axis.
% 
%    ylabel('text','Property1',PropertyValue1,'Property2',PropertyValue2,...)
%    sets the values of the specified properties of the ylabel.
% 
%    ylabel(AX,...) adds the ylabel to the specified axes.
% 
%    H = ylabel(...) returns the handle to the text object used as the label.
% 
%    See also xlabel, zlabel, title, text.

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
  fontsize = '12';

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

  __send_plot_message__('ylabel', 'label', strcat('"',label,'"'),
               'font', strcat('"', font, '"'),
               'fontsize', sprintf('%.0f', fontsize)
              );
end
