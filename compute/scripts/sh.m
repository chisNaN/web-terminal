function sh(varargin)

  if(nargin < 1) error('No arguments given'); end

  str = sprintf('%s ', varargin{:});
  str(size(str,  2)) = [];

  system(str);

end
