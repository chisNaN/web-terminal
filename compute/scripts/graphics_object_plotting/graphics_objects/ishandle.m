% ishandle(H) returns an array whose elements are 1 where the elements of H are object handles, and 0 where they are not.
function [result] = ishandle(varargin)
  %http://www.mathworks.com/help/matlab/ref/ishandle.html

  assert(nargin == 1, 'Incorrect usage.  ishandle takes exactly one argument');

  a = struct();
  a.handles = varargin{1};
  result = __send_go_message__('ishandle', a); 
endfunction
