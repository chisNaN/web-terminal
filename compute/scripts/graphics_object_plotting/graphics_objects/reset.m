% reset:  Reset graphics object properties to their defaults
% Usage:
%  reset(h) 
% 
% reset(h) resets all properties having factory defaults on the object identified by h. To see the list of factory defaults, use the statement
% 
% get(0,'factory')
% If h is a figure, the MATLAB® software does not reset Position, Units, WindowStyle, or PaperUnits. If h is an axes, MATLAB does not reset Position and Units.
function [result] = reset(varargin)
  % http://www.mathworks.com/help/matlab/ref/reset.html
  assert(nargin == 1, 'Expected exactly one argument.  Usage:  reset(h), where h is a graphics object handle.');

  a = struct();
  a.handle = varargin{1};
  result = __send_go_message__('reset', a);
  error('get has yet to be implemented');
endfunction
