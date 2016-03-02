% __image_pixel_size__:  default unimplemented graphics_object mutator
function [result] = __image_pixel_size__(varargin)
  disp('__image_pixel_size__ arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('__image_pixel_size__ has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('__image_pixel_size__', a); 

endfunction
