% dellistener:  default unimplemented graphics_object mutator
function [result] = dellistener(varargin)
  disp('dellistener arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('dellistener has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('dellistener', a); 

endfunction
