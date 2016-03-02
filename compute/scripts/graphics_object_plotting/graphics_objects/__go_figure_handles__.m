% __go_figure_handles__:  default unimplemented graphics_object mutator
function [result] = __go_figure_handles__(varargin)
  disp('__go_figure_handles__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__go_figure_handles__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__go_figure_handles__', a); 

endfunction
