% __go_uitoolbar__:  default unimplemented graphics_object mutator
function [result] = __go_uitoolbar__(varargin)
  disp('__go_uitoolbar__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__go_uitoolbar__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__go_uitoolbar__', a); 

endfunction
