function axis(varargin)

% axis manipulates commonly used axes properties. 
% 
% Syntax
% axis([xmin xmax ymin ymax])
% axis([xmin xmax ymin ymax zmin zmax cmin cmax])
% v = axis
% axis auto
% axis manual
% axis tight
% axis fill
% axis ij
% axis xy
% axis equal
% axis image 
% axis square
% axis vis3d
% axis normal
% axis off
% axis on
% axis(axes_handles,...)
% [mode,visibility,direction] = axis('state')
% 
% Description
% 
% axis([xmin xmax ymin ymax]) sets the limits for the x- and y-axis of the current axes.
% 
% axis([xmin xmax ymin ymax zmin zmax cmin cmax]) sets the x-, y-, and z-axis limits and the color scaling limits (see caxis) of the current axes.
% 
% v = axis returns a row vector containing scaling factors for the x-, y-, and z-axis. v has four or six components depending on whether the current axes is 2-D or 3-D, respectively. The returned values are the current axes XLim, Ylim, and ZLim properties.
% 
% axis auto sets MATLAB default behavior to compute the current axes limits automatically, based on the minimum and maximum values of x, y, and z data. You can restrict this automatic behavior to a specific axis. For example, axis 'auto x' computes only the x-axis limits automatically; axis 'auto yz' computes the y- and z-axis limits automatically.
% 
% axis manual and axis(axis) freezes the scaling at the current limits, so that if hold is on, subsequent plots use the same limits. This sets the XLimMode, YLimMode, and ZLimMode properties to manual.
% 
% axis tight sets the axis limits to the range of the data.
% 
% axis fill sets the axis limits and PlotBoxAspectRatio so that the axes fill the position rectangle. This option has an effect only if PlotBoxAspectRatioMode or DataAspectRatioMode is manual.
% 
% axis ij places the coordinate system origin in the upper left corner. The i-axis is vertical, with values increasing from top to bottom. The j-axis is horizontal with values increasing from left to right.
% 
% axis xy draws the graph in the default Cartesian axes format with the coordinate system origin in the lower left corner. The x-axis is horizontal with values increasing from left to right. The y-axis is vertical with values increasing from bottom to top.
% 
% axis equal sets the aspect ratio so that the data units are the same in every direction. The aspect ratio of the x-, y-, and z-axis is adjusted automatically according to the range of data units in the x, y, and z directions.
% 
% axis image is the same as axis equal except that the plot box fits tightly around the data.
% 
% axis square makes the current axes region square (or cubed when three-dimensional). This option adjusts the x-axis, y-axis, and z-axis so that they have equal lengths and adjusts the increments between data units accordingly.
% 
% axis vis3d freezes aspect ratio properties to enable rotation of 3-D objects and overrides stretch-to-fill.
% 
% axis normal automatically adjusts the aspect ratio of the axes and the relative scaling of the data units so that the plot fits the figure's shape as well as possible.
% 
% axis off turns off all axis lines, tick marks, and labels.
% 
% axis on turns on all axis lines, tick marks, and labels.
% 
% axis(axes_handles,...) applies the axis command to the specified axes. For example, the following statements
% 
% h1 = subplot(221);
% h2 = subplot(222);
% axis([h1 h2],'square')
% set both axes to square.
% 
% [mode,visibility,direction] = axis('state') returns three strings indicating the current setting of axes properties:
% 
% Output Argument
% Strings Returned
% mode
% 
% 'auto' | 'manual'
% 
% visibility
% 
% 'on' | 'off'
% 
% direction
% 
% 'xy' | 'ij'
% 
% mode is auto if XLimMode, YLimMode, and ZLimMode are all set to auto. If XLimMode, YLimMode, or ZLimMode is manual, mode is manual.
% 
% Keywords to axis can be combined, separated by a space (e.g., axis tight equal). These are evaluated from left to right, so subsequent keywords can overwrite properties set by prior ones.

% TODO: AXIS HANDLES ARGUMENT

for i = 1:nargin
  input = varargin{i};
  switch class(input)
    case 'char'
      if (size(input, 2) >= 4) && (all(input(1:4) == 'auto'))
        if (size(input, 2) == 4)
          input = 'auto xyz';
        end
        for i=5:size(input, 2)
          if (input(i) == 'x')
            xlim('auto');
          elseif (input(i) == 'y')
            ylim('auto');
          elseif (input(i) == 'z')
            zlim('auto');
          end
        end
      elseif strcmp(input, 'ij')
        xlim([0, NaN]);
        ylim([NaN, 0]);
      elseif strcmp(input, 'xy')
        xlim([0, NaN]);
        ylim([0, NaN]);
      elseif strcmp(input, 'manual')
        xlim('manual');
        ylim('manual');
        zlim('manual');
      else
        % tight, equal, image, square, normal, off, on
        % fill? vis3d?
        __send_plot_message__('axis', 'option', strcat('"', input, '"'));
      end
    case 'double'
      if size(input, 2) == 4
        xlim([input(1), input(2)]);
        ylim([input(3), input(4)]);
      elseif size(input, 2) == 8
        xlim([input(1), input(2)]);
        ylim([input(3), input(4)]);
        zlim([input(5), input(6)]);
        caxis([input(7), input(8)]);
      else
        error('Incorrect number of elements in limits array');
      end
    otherwise
      error(strcat('Invalid input type: ', class(input)));
  end
end

