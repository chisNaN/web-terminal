function res = __json_array__(format, varargin)
  res = '[';
  nvar = length(varargin);
  if(nvar>0)
    res=strcat(res,sprintf(format, varargin{1}));
    for i=2:nvar
      res=strcat(res, ",", sprintf(format,varargin{i}));
    end
  end
  res=strcat(res,"]");
