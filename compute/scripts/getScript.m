function getScript(varargin)
% loads script in the browser
%    getScript('scriptname') loads the script called scriptname into the browser

  % TODO: change name?
  % TODO: block until the script is loaded by the client??
  if(nargin < 1) error('No arguments given'); end
  if (nargin == 1)
    scriptname = varargin{1};
  else
   error('Invalid number of arguments');
  end
  if ~isequal(exist(scriptname,'file'),2)
    disp(sprintf('%s is not a valid script!', scriptname));
  end
  scriptname = file_in_path('.', scriptname);

  __send_server_message__('get_script', 'file', strcat('"', scriptname, '"'));
end
