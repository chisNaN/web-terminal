% __go_uicontextmenu__:  default unimplemented graphics_object mutator
function [result] = __go_uicontextmenu__(varargin)
  disp('__go_uicontextmenu__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__go_uicontextmenu__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__go_uicontextmenu__', a); 

endfunction
