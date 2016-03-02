% addproperty:  default unimplemented graphics_object mutator
function [result] = addproperty(varargin)
  disp('addproperty arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('addproperty has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('addproperty', a); 

endfunction
