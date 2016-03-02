function __send_plot_message__(type, varargin)
  % sends a <PLOT> message to the client of this octave instance
  %f = popen(sprintf('/usr/bin/node %s/Dropbox/ilab/scripts/client.js', getenv('HOME')), 'w');
  persistent f = fopen('./local/node.fifo', 'w');
  %f = stderr;
  %fprintf(f, '"client_id":"%s",\n', client_id );
  body = sprintf('"type":"%s"', type);
  if (length(varargin) > 0)
    body = strcat(body, sprintf(',"%s":%s', varargin{:}));
  end
  message = strcat('<PLOT>\n{', body, '}\n<ENDPLOT>\n');
  fprintf(f, message);
  fflush(f);

  %pclose(f);
