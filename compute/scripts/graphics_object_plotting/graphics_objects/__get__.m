% __get__:  default unimplemented graphics_object mutator
function [result] = __get__(varargin)
  disp('__get__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__get__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__get__', a); 

endfunction
