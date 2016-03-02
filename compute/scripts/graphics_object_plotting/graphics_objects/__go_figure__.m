% __go_figure__:  default unimplemented graphics_object mutator
function [result] = __go_figure__(varargin)
  assert(mod(nargin, 2) == 1, 'Expected an odd number of arguments to __go_figure__');

  a = struct();
  a.figure_id = varargin{1};
  a.properties = struct();
  for i = 2:2:nargin
    a.properties.(varargin{i}) = varargin{i+1};
  end
  result = __send_go_message__('__go_figure__', a);
endfunction
