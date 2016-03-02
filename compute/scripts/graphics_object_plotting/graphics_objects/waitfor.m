% waitfor:  default unimplemented graphics_object mutator
function [result] = waitfor(varargin)
  disp('waitfor arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('waitfor has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('waitfor', a); 

endfunction
