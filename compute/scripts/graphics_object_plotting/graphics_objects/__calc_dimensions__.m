% __calc_dimensions__:  default unimplemented graphics_object mutator
function [result] = __calc_dimensions__(varargin)
  disp('__calc_dimensions__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__calc_dimensions__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__calc_dimensions__', a); 

endfunction
