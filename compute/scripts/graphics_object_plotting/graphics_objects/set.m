% set:  Set Handle Graphics object properties
% 
% set(H,'PropertyName',PropertyValue,...)
% set(H,a)
% set(H,pn,pv,...)
% set(H,pn,MxN_pv)
% a = set(h)
% pv = set(h,'PropertyName')
% 
% 
%set(H,'PropertyName',PropertyValue,...) sets the named properties to the specified values on the object(s) identified by H. H can be a vector of handles, in which case set sets the properties' values for all the objects.
%
%set(H,a) sets the named properties to the specified values on the object(s) identified by H. a is a structure array whose field names are the object property names and whose field values are the values of the corresponding properties.
%
%set(H,pn,pv,...) sets the named properties specified in the cell array pn to the corresponding value in the cell array pv for all objects identified in H.
%
%set(H,pn,MxN_pv) sets n property values on each of m graphics objects, where m = length(H) and n is equal to the number of property names contained in the cell array pn. This allows you to set a given group of properties to different values on each object.
%
%a = set(h) returns the user-settable properties and possible values for the object identified by h. a is a structure array whose field names are the object's property names and whose field values are the possible values of the corresponding properties. If you do not specify an output argument, the MATLAB® software displays the information on the screen. h must be scalar.
%
%pv = set(h,'PropertyName') returns the possible values for the named property. If the possible values are strings, set returns each in a cell of the cell array pv. For other properties, set returns a statement indicating that PropertyName does not have a fixed set of property values. If you do not specify an output argument, MATLAB displays the information on the screen. h must be scalar.

function [result] = set(varargin)
  % http://www.mathworks.com/help/matlab/ref/set.html

  % TODO ALSO: 
  % set(h, 'DefaultNodetypeProperty', value)
  % set(h,'Property','factory')


  a = struct();
  if nargin == 1
    a.handle = varargin{1};
    assert(length(varargin{1}) == 1, 'Incorrect usage.  Either specify properties to set, or give only one handle.')
    assert(isscalar(varargin{1}), 'Incorrect usage.  Handle should be a scalar.')
    result = __send_go_message__('get_settable_properties', a); 
  elseif (nargin == 2 & ischar(varargin{2}))
    a.handle = varargin{1}
    a.property = varargin{2};
    result = __send_go_message__('get_possible_values', a); 
  else
    a.handles = varargin{1}
    a.property_settings = struct();
    if (nargin == 2)
      assert(isstruct(varargin{2}), 'Expected second argument to either be a property name or a struct');
      a.property_settings = varargin{2};
    end
  end
  error('get has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('set', a); 

endfunction
