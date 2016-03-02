% register_graphics_toolkit:  default unimplemented graphics_object mutator
function [result] = register_graphics_toolkit(varargin)
  disp('register_graphics_toolkit arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('register_graphics_toolkit has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('register_graphics_toolkit', a); 

endfunction
