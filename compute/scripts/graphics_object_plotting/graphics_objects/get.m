% get:  Query Handle Graphics object properties
% 
% get(h)
% get(h,'PropertyName')
% <m-by-n value cell array> = get(H,pn) 
% a = get(h)
% a = get(0)
% a = get(0,'Factory')
% a = get(0,'FactoryObjectTypePropertyName') 
% a = get(h,'Default')
% a = get(h,'DefaultObjectTypePropertyName')
% 
% get(h) returns all properties of the graphics object identified by the handle h and their current values. For this syntax, h must be a scalar.
% 
% get(h,'PropertyName') returns the value of the property 'PropertyName' of the graphics object identified by h.
% 
% <m-by-n value cell array> = get(H,pn) returns n property values for m graphics objects in the m-by-n cell array, where m = length(H) and n is equal to the number of property names contained in pn.
% 
% a = get(h) returns a structure whose field names are the object's property names and whose values are the current values of the corresponding properties. If you do not specify an output argument, MATLAB® displays the information on the screen. For this syntax, h may be a scalar or a m-by-n array of handles. If h is a vector, a will be a (m*n)-by-1 struct array.
% 
% a = get(0) returns the current values of all user-settable properties. a is a structure array whose field names are the object property names and whose field values are the values of the corresponding properties. If you do not specify an output argument, MATLAB displays the information on the screen.
% 
% a = get(0,'Factory') returns the factory-defined values of all user-settable properties. a is a structure array whose field names are the object property names and whose field values are the values of the corresponding properties. If you do not specify an output argument, MATLAB displays the information on the screen.
% 
% a = get(0,'FactoryObjectTypePropertyName') returns the factory-defined value of the named property for the specified object type. The argument FactoryObjectTypePropertyName is the word Factory concatenated with the object type (e.g., Figure) and the property name (e.g., Color)FactoryFigureColor.
% 
% a = get(h,'Default') returns all default values currently defined on object h. a is a structure array whose field names are the object property names and whose field values are the values of the corresponding properties. If you do not specify an output argument, MATLAB displays the information on the screen.
% 
% a = get(h,'DefaultObjectTypePropertyName') returns the factory-defined value of the named property for the specified object type. The argument DefaultObjectTypePropertyName is the word Default concatenated with the object type (e.g., Figure) and the property name (e.g., Color):
%   DefaultFigureColor
 
function [result] = get(varargin)
  % http://www.mathworks.com/help/matlab/ref/get.html

  % disp('get arguments:');
  % for i = 1:nargin
  %   disp(sprintf('argument %d:', i));
  %   disp(varargin{i});
  % end

  % TODO: use nargout to determine whether to display

  a = struct();
  if nargin == 1
    a.handle = varargin{1};
    assert(length(varargin{1}) == 1, 'Incorrect usage.  Either specify properties, or give only one handle.')
    assert(isscalar(varargin{1}), 'Incorrect usage.  Handle should be a scalar.')
    result = __send_go_message__('get_all', a); 
    assert(isstruct(result), 'Internal error.  Return value is not struct.');
  elseif nargin == 2
    a.handles = varargin{1};
    a.properties = varargin{2};
    result = __send_go_message__('get', a);
    result = __ensure_iscell__(result);
  else 
    error('Expected 1 or 2 arguments');
  end
endfunction
