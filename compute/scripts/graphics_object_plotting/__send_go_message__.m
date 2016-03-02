function res = __send_go_message__(varargin)
  % usage:
  %  __send_go_message(type, struct)
  %  __send_go_message(type, prop1, val1, prop2, val2, ...)

  if nargin == 2
    s = varargin{2};
  else
    assert(mod(nargin, 2) == 1, 'Invalid number of arguments to __send_go_message__')
    s = struct(varargin{2:end});
  end

  s.graphics_object_message_type = varargin{1};
  res = __send_rpc_message__('graphics_object', s);
