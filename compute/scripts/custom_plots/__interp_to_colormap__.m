function colors = __interp_to_colormap__(varargin)
  C = varargin{1};
  if (nargin==3)
    cmin = varargin{2};
    cmax = varargin{3};
  else
    assert(nargin == 1, 'Invalid number of arguments');
    cmin = min(min(C));
    cmax = max(max(C));
  end
  cmap = colormap();
  ncolors = size(cmap, 1);
  colors = zeros(size(C, 1), size(C, 2), 3);
  interp_xs = cat(2, [min(min(C))-1], cmin + (0 : 1 : ncolors-1) * (cmax - cmin) / (ncolors - 1) , [max(max(C))+1]);

  for i = 1:3 % for each of rgb
    interp_ys = cat(1, [cmap(1, i)], cmap(:, i), [cmap(end, i)]);
    colors(:,:,i) = interp1(interp_xs, interp_ys, C);
  end
  colors = uint8(colors * 255);
endfunction
