% __is_handle_visible__:  default unimplemented graphics_object mutator
function [result] = __is_handle_visible__(varargin)
  assert(nargin == 1, 'Incorrect usage.  __is_handle_visible__ takes exactly one argument');
  assert(length(varargin{1}) == 1, 'Expected only one handle.')

  a = struct();
  a.handle = varargin{1};
  result = __send_go_message__('is_handle_visible', a);
endfunction
