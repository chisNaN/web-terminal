function txt = __mat2json__(x)
% returns json representation of matrix
% a dictionary of {rows, cols, data=[float,float...]}
% data is column major (agreeing with matlab)
header = sprintf('{ "rows": %d, "cols": %d, "data":[', size(x,1), size(x,2));
data = sprintf('%g,', x);
data(size(data,2))=[]; % remove last comma
footer = ']}';
% TODO: replace Inf with something else?
txt = strcat(header, data, footer);
txt = strrep( txt, "Inf", num2str(intmax()));
txt = strrep( txt, "NaN", "null");

