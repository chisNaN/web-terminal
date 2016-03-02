% loaded_graphics_toolkits:  default unimplemented graphics_object mutator
function [result] = loaded_graphics_toolkits(varargin)
  disp('loaded_graphics_toolkits arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('loaded_graphics_toolkits has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('loaded_graphics_toolkits', a); 

endfunction
