% __go_patch__:  default unimplemented graphics_object mutator
function [result] = __go_patch__(varargin)
  disp('__go_patch__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__go_patch__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__go_patch__', a); 

endfunction
