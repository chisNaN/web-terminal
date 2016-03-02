function res = __send_rpc_message__(varargin)
  % usage:
  %  __send_rpc_message(type, struct)
  %  __send_rpc_message(type, prop1, val1, prop2, val2, ...)

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
  jsonbody = savejson('', s, opt);

  __write_message_to_node_fifo__('RPC', jsonbody)

  unwind_protect
    % TODO: do this better (look for where the warnings status is restored)
    ws = warning ('off', 'all');

    if (exist('./local/from_node.fifo') == 0)
      system('mkfifo ./local/from_node.fifo');
    end

    % 'opening from node fifo'
    % fflush(stdout)
    g = fopen('/local/from_node.fifo', 'r');
    % 'opened from node fifo'
    % fflush(stdout)
    res = fread(g)';
    res = sprintf('%s', res);

    start_len = size('<RESPONSE>\', 2);
    end_len = size('<ENDRESPONSE>\', 2);

    num_incomplete = 0;
    while ~((numel(res) >= end_len) && strcmp('<ENDRESPONSE>', res(end - end_len+1: end - 1)))
      num_incomplete = num_incomplete + 1;
      %disp('Response not gotten yet!');
      fclose(g);

      g = fopen('./local/from_node.fifo', 'r');
      res = fread(g)';
      res = sprintf('%s', res);

      if num_incomplete == 1000
        % disp(res)
        error(sprintf('Uh oh!  Invalid RPC message response:  %s', res));
      end
    end

    % res
    res = res(start_len + 1: end - end_len);

    warning(ws);

    res = loadjson(res);

  unwind_protect_cleanup
    fclose(g);
  end

  if res.error
    error(res.error);
  else
    res = res.result;
  end
