% addlistener:  default unimplemented graphics_object mutator
function [result] = addlistener(varargin)
  disp('addlistener arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('addlistener has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('addlistener', a); 

endfunction
