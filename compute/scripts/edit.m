function edit(varargin)
% edit(file1, file2, ...)
%
% Open the files specified for editing.  Each argument must be a string specifying
% the file to open.

  if(nargin < 1)
    try_edit_file('Untitled')
  else
    for i = 1:nargin
      try_edit_file(varargin{i})
    end
  end

end

function try_edit_file(path)
  if isequal(exist(path,'dir'),7)
    disp(sprintf('Cannot edit directory: %s', path));
  else
    if ~isequal(exist(path,'file'),2)
      sh('touch', path);
      %fclose(fopen(path,'w'));
    end
    fullpath = file_in_path('.', path);
    if ~numel(fullpath)
      fullpath = file_in_path('.', strcat(path, '.m'));
    end
    if ~numel(fullpath)
      error(sprintf('Something went wrong getting the path for %s', path));
    end
    __send_server_message__('edit', 'path', fullpath, 'encoding', 'UTF8');
  end

end

