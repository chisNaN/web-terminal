% drawnow:  default unimplemented graphics_object mutator
function [result] = drawnow(varargin)
  disp('drawnow arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('drawnow has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('drawnow', a); 

endfunction
