% __go_uipushtool__:  default unimplemented graphics_object mutator
function [result] = __go_uipushtool__(varargin)
  disp('__go_uipushtool__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__go_uipushtool__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__go_uipushtool__', a); 

endfunction
