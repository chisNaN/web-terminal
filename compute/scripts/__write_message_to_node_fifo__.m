function __write_message_to_node_fifo__(tag, message_body)
  persistent f = fopen('./local/node.fifo', 'w');
  fprintf(f, strcat('<', tag, '>\n'));
  fprintf(f, message_body);
  fprintf(f, strcat('<END', tag, '>\n'));
  fflush(f);
