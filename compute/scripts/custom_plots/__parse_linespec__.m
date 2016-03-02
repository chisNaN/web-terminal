function [l, c, m, msg] = __parse_linespec__(style)
   [l, c, m, msg] = colstyle(style);
   if(isempty(l)) 
     l = 'null'; 
   else
     l = sprintf('"%s"', l);
   end

   if(isempty(c))
     c = 'null'; 
   elseif(isnumeric(c))
     c = strcat( '[', sprintf('%g, ', c), ']'); 
   elseif(ischar(c))
     c = sprintf('"%s"', c);
   end
   if(isempty(m) || m=="none")
     m = 'null';
   else
     m = sprintf('"%s"', m);
   end

