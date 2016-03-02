function __send_server_message__(varargin)
  % usage:
  %  __send_server_message(type, struct)
  %  __send_server_message(type, prop1, val1, prop2, val2, ...)

  if nargin == 2
    assert(isstruct(varargin{2}), 'Invalid input.  Expected a struct.');
    s = varargin{2};
  else
    assert(mod(nargin, 2) == 1, 'Invalid number of arguments to __send_rpc_message__')
    s = struct(varargin{2:end});
  end
  s.type = varargin{1};

  opt = struct();
  opt.NaN = 'null';
  opt.Inf = '$11e+999';

  % TODO: THIS FUNCTION IS REALLY SLOW
  % ESPECIALLY RELEVANT FOR DRAWNOW HOOK
  jsonbody = savejson('', s, opt);

  __write_message_to_node_fifo__('SERVERMESSAGE', jsonbody)

