function __drawnow_hook__(varargin)
  %figures = [
    % { handle:  handle,
    %   axes:
    %   {axis_handle:
    %           { handle: blah
    %             (is_legend: )
    %             outer position: [top, bottom, width, height]
    %                 xlim, ylim
    %                 xlabel, ylabel, title
    %               }
    %           }
    % } ]

  MAX_EL_FOR_NON_TILED_DRAW = 10000;

  a = struct();

  fs = {};
  f_handles = get(0,'Children');
  nfigs = size(f_handles, 1);
  for i = 1:1:nfigs
      f_handle = f_handles(i);
      f_struct = struct();
      f_struct.handle = f_handle;
      f_axes = {};

      a_handles = get(f_handle, 'Children');
      for j = 1:1:size(a_handles, 1)
          a_handle = a_handles(j);
          a_struct = struct();

          a_struct.handle = sprintf('%.100f', a_handle);
          is_legend = strcmp(get(a_handle, 'Tag'), 'legend');
          % http://stackoverflow.com/questions/9071988/how-to-tell-legends-from-axes-in-matlab
          a_struct.is_legend = is_legend;

          child_handles = get(a_handle, 'Children');

          tot_data_count = 0;
          local_plotting = true; %~is_legend;

          for k = 1:1:size(child_handles, 1)
            child_handle = child_handles(k);
            [tot_data_count] = update_from_handle(child_handle, tot_data_count, MAX_EL_FOR_NON_TILED_DRAW);

            if (tot_data_count > MAX_EL_FOR_NON_TILED_DRAW)
              local_plotting = false;
              break;
            end
          end

          a_struct.local_plotting = local_plotting;

          % send all the children!
          if local_plotting
            a_children = {};

            for k = 1:1:size(child_handles, 1)
              child_handle = child_handles(k);

              type = get(child_handle, 'Type');
              if strcmp('hggroup', type)
                % TODO: make this more efficient
                % http://www.mathworks.com/help/matlab/ref/hggroupproperties.html
                new_children = get_hg_group_structs(child_handle, a_handle, f_handle);
                for m = 1:1:size(new_children, 2)
                  a_children{end+1} = new_children{m};
                end
              else
                % http://www.mathworks.com/help/matlab/ref/line_props.html
                a_children{end+1} = get_child_struct(child_handle, a_handle, f_handle);
              end

            end
            a_struct.children = a_children;

          end

          a_struct.modified = get(a_handle, '__modified__');

          %http://www.mathworks.com/help/matlab/ref/view.html

          % doesnt work for some reason
          %[az, el] = view(a_handle);
          oldgcf = mygcf;
          set(0, 'currentfigure', f_handle);
          oldgca = gca;
          set(gcf, 'currentaxes', a_handle);
          [az, el] = view();
          set(gcf, 'currentaxes', oldgca);
          set(0, 'currentfigure', oldgcf);

          if and(az == 0, el == 90)
            a_struct.ndims = 2;
          else
            a_struct.ndims = 3;
          end

          %if ~is_legend

          % http://www.mathworks.com/help/matlab/ref/axes_props.html

          a_struct.OuterPosition = get(a_handle, 'OuterPosition');
          a_struct.Position = get(a_handle, 'Position');

          a_struct.XLim = get(a_handle, 'XLim');
          a_struct.YLim = get(a_handle, 'YLim');
          a_struct.XScale = get(a_handle, 'XScale');
          a_struct.YScale = get(a_handle, 'YScale');

          % a_struct.can_pan = (a_struct.ndims == 2) & strcmp('linear', a_struct.XScale) & strcmp('linear', a_struct.YScale);

          a_struct.XTick = get(a_handle, 'XTick');
          a_struct.YTick = get(a_handle, 'YTick');
          a_struct.ZTick = get(a_handle, 'ZTick');
          a_struct.XTickMode = get(a_handle, 'XTickMode');
          a_struct.YTickMode = get(a_handle, 'YTickMode');
          a_struct.ZTickMode = get(a_handle, 'ZTickMode');
          a_struct.XTickLabel = get(a_handle, 'XTickLabel');
          a_struct.YTickLabel = get(a_handle, 'YTickLabel');
          a_struct.ZTickLabel = get(a_handle, 'ZTickLabel');
          a_struct.XMinorTick = get(a_handle, 'XMinorTick');
          a_struct.YMinorTick = get(a_handle, 'YMinorTick');
          a_struct.ZMinorTick = get(a_handle, 'ZMinorTick');

          a_struct.XDir = get(a_handle, 'XDir');
          a_struct.YDir = get(a_handle, 'YDir');
          a_struct.ZDir = get(a_handle, 'ZDir');

          a_struct.XLabel = get(get(a_handle, 'XLabel'), 'String');
          a_struct.YLabel = get(get(a_handle, 'YLabel'), 'String');
          a_struct.ZLabel = get(get(a_handle, 'ZLabel'), 'String');
          a_struct.Title = get(get(a_handle, 'Title'), 'String');

          a_struct.XGrid = get(a_handle, 'XGrid');
          a_struct.YGrid = get(a_handle, 'YGrid');
          a_struct.ZGrid = get(a_handle, 'ZGrid');
          a_struct.XMinorGrid = get(a_handle, 'XMinorGrid');
          a_struct.YMinorGrid = get(a_handle, 'YMinorGrid');
          a_struct.ZMinorGrid = get(a_handle, 'ZMinorGrid');
          %end
          f_axes{end+1} = a_struct;
      end

      f_struct.axes = f_axes;
      fs{end+1} = f_struct;
  end

  msg = struct();
  msg.type = 'redraw';
  a.figures = fs;
  if nfigs ~= 0
    a.gcf = mygcf;
  end
  filename = '/tmp/figures.mat';
  msg.file = filename;
  save(filename, 'a');

  % TODO:  this takes a while b/c of the savejson!
  __send_server_message__('redraw', msg);
endfunction

function [tot_data_count] = update_from_handle(h, tot_data_count, max_count)
  type = get(h, 'Type');

  if strcmp('hggroup', type)
    child_handles = get(h, 'Children');
    for j = 1:1:size(child_handles, 1)
      child_h = child_handles(j);
      [tot_data_count] = update_from_handle(child_h, tot_data_count, max_count);
      if (tot_data_count > max_count)
        return;
      end
    end
  elseif strcmp('line', type)
    tot_data_count += numel( get(h, 'XData')(:) );
    tot_data_count += numel( get(h, 'YData')(:) );
    tot_data_count += numel( get(h, 'ZData')(:) );
  elseif strcmp('text', type)
    tot_data_count += 1;
  elseif strcmp('image', type)
    tot_data_count += numel( get(h, 'CData')(:) );
  elseif strcmp('patch', type)
    % TODO: re-enable patch
    tot_data_count += Inf;
    % currently cannot handle multiple faces
    if(size( get(h, 'XData')(:), 2) > 1 ) 
      tot_data_count += Inf;
    end
    if(size( get(h, 'YData')(:), 2) > 1 ) 
      tot_data_count += Inf;
    end
    if(size( get(h, 'ZData')(:), 2) > 1 ) 
      tot_data_count += Inf;
    end
    tot_data_count += numel( get(h, 'XData')(:) );
    tot_data_count += numel( get(h, 'YData')(:) );
    tot_data_count += numel( get(h, 'ZData')(:) );
    tot_data_count += numel( get(h, 'CData')(:) );
  else
    tot_data_count += Inf;
  end
endfunction


function [child_struct] = get_child_struct(child_handle, a_handle, f_handle)
  child_struct = struct();
  type = get(child_handle, 'Type');
  child_struct.Type = type;
  child_struct.handle = sprintf('%.100f', child_handle);

  if strcmp('line', type)
    % http://www.mathworks.com/help/matlab/ref/line_props.html
    child_struct.Color = get(child_handle, 'Color');
    child_struct.LineStyle = get(child_handle, 'LineStyle');
    child_struct.LineWidth = get(child_handle, 'LineWidth');
    child_struct.Marker = get(child_handle, 'Marker');
    child_struct.MarkerEdgeColor = get(child_handle, 'MarkerEdgeColor');
    child_struct.MarkerFaceColor = get(child_handle, 'MarkerFaceColor');
    child_struct.MarkerSize = get(child_handle, 'MarkerSize');
    child_struct.XData = get(child_handle, 'XData');
    child_struct.YData = get(child_handle, 'YData');
    child_struct.ZData = get(child_handle, 'ZData');
  elseif strcmp('text', type)
    %http://www.mathworks.com/help/matlab/ref/text_props.html
    child_struct.Color = get(child_handle, 'Color');
    %child_struct.EdgeColor = get(child_handle, 'EdgeColor');
    %child_struct.Extent = get(child_handle, 'Extent');
    %child_struct.FontAngle = get(child_handle, 'FontAngle');
    child_struct.FontName = get(child_handle, 'FontName');
    child_struct.FontSize = get(child_handle, 'FontSize');
    %child_struct.FontWeight = get(child_handle, 'FontWeight');
    %child_struct.FontUnits = get(child_handle, 'FontUnits');
    child_struct.HorizontalAlignment = get(child_handle, 'HorizontalAlignment');
    %child_struct.LineStyle = get(child_handle, 'LineStyle');
    %child_struct.LineWidth = get(child_handle, 'LineWidth');
    %child_struct.Margin = get(child_handle, 'Margin');
    child_struct.Position = get(child_handle, 'Position');
    child_struct.Rotation = get(child_handle, 'Rotation');
    child_struct.String = get(child_handle, 'String');
    %child_struct.Units = get(child_handle, 'Units');
    child_struct.VerticalAlignment = get(child_handle, 'VerticalAlignment');
  elseif strcmp('image', type)
    % http://www.mathworks.com/help/matlab/ref/image_props.html
    % child_struct.AlphaData = get(child_handle, 'AlphaData');
    % child_struct.AlphaDataMapping = get(child_handle, 'AlphaDataMapping');
    CData= get(child_handle, 'CData');
    if size(CData, 3) ~= 3
      CDataMapping = get(child_handle, 'CDataMapping');
      cmap = get(f_handle, 'Colormap');
      if strcmp(CDataMapping, 'scaled')
        % TODO: this is very slow!
        CData = scale_cdata(CData, get(a_handle, 'CLim')(1), get(a_handle, 'CLim')(2));
      end
      [r, g, b] = get_true_color(cmap, CData);
    end
    % TODO: make octaveparser handle this properly
    % child_struct.CData = CData
    child_struct.n = size(CData, 1);
    child_struct.m = size(CData, 2);

    child_struct.r = reshape(r, 1, numel(r));
    child_struct.g = reshape(g, 1, numel(g));
    child_struct.b = reshape(b, 1, numel(b));

    child_struct.XData = get(child_handle, 'XData');
    child_struct.YData = get(child_handle, 'YData');
  elseif strcmp('patch', type)
    %http://www.mathworks.com/help/matlab/ref/patch_props.html

    CData= get(child_handle, 'CData');
    if size(CData, 3) ~= 3
      CDataMapping = get(child_handle, 'CDataMapping');
      cmap = get(f_handle, 'Colormap');
      if strcmp(CDataMapping, 'scaled')
        % TODO: this is very slow!
        CData = scale_cdata(CData, get(a_handle, 'CLim')(1), get(a_handle, 'CLim')(2));
      end
      CData = get_true_color(cmap, CData);
    end
    child_struct.CData = CData;


    child_struct.EdgeColor = get(child_handle, 'EdgeColor');
    child_struct.FaceColor = get(child_handle, 'FaceColor');
    child_struct.FaceVertexCData = get(child_handle, 'FaceVertexCData');
    child_struct.LineStyle = get(child_handle, 'LineStyle');
    child_struct.LineWidth= get(child_handle, 'LineWidth');
    child_struct.Marker= get(child_handle, 'Marker');
    child_struct.MarkerEdgeColor = get(child_handle, 'MarkerEdgeColor');
    child_struct.MarkerFaceColor = get(child_handle, 'MarkerFaceColor');
    child_struct.MarkerSize = get(child_handle, 'MarkerSize');
    %child_struct.Vertices = get(child_handle, 'Vertices'); % appears to just be [xdata, ydata, zdata]
    child_struct.XData = get(child_handle, 'XData')';
    child_struct.YData = get(child_handle, 'YData')';
    child_struct.ZData = get(child_handle, 'ZData')';
  end
endfunction

function [children] = get_hg_group_structs(h, a_handle, f_handle);

  children = {};

  child_handles = get(h, 'Children');
  for k = 1:1:size(child_handles, 1)
    child_handle = child_handles(k);

    type = get(child_handle, 'Type');
    if strcmp('hggroup', type)
      % TODO: make thls more efficient
      new_children = get_hg_group_structs(child_handle, a_handle, f_handle);
      for m = 1:1:size(new_children, 1)
        children{end+1} = new_children{m};
      end
    else
      child = get_child_struct(child_handle, a_handle, f_handle);
      children{end+1} = child;
    end
  end
endfunction

function [r, g, b] = get_true_color(cmap, cdata)
  n = size(cmap, 1);
  cdata = min(max(cdata, 1), n);
  r = interp1(cmap(:,1), cdata);
  g = interp1(cmap(:,2), cdata);
  b = interp1(cmap(:,3), cdata);
  assert(~any(isnan(cdata)));
endfunction

% function [cdata] = get_true_color(cmap, cdata)
%   n = size(cmap, 1);
%   cdata = min(max(cdata, 1), n);
%   cdata = [
%     interp1(cmap(:,1), cdata);
%     interp1(cmap(:,2), cdata);
%     interp1(cmap(:,3), cdata);
%   ];
%   assert(~any(isnan(cdata)));
% endfunction

function [data] = scale_cdata(data, cmin, cmax)
  % scale from 1 to ncolors
  ncolors = size(colormap, 1);
  if (cmin == cmax)
    data = data * 0 + 1
  else
    % min -> 0
    % max -> ncolors
    % a * min + b = 1
    % a * max + b = ncolors
    a = (ncolors - 1) / (cmax - cmin);
    b = - cmin * (ncolors - 1) / (cmax - cmin) + 1;
    data = a * data + b;
  end
endfunction


function [h] = mygcf()
  h = 0;
  if (nargin == 0)
    h = get (0, "currentfigure");
  endif
endfunction

