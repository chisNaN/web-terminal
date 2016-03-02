% __go_line__:  default unimplemented graphics_object mutator
function [result] = __go_line__(varargin)
  disp('__go_line__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__go_line__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__go_line__', a); 

endfunction
