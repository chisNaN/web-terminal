% SCRIPT TO OUTPUT FACTORY DEFAULTS TO A JSON FILE (USE IN MATLAB)

factory_defaults = get(0, 'factory');
savejson('', factory_defaults, 'FactoryDefaults.json');

% make this more detailed?
%
% factory_defaults_struct();
% 
% fields = fieldnames(factory_defaults);
% for i=1:numel(fields)
%   field = fields(i);
%   field = field{1};
%   
%   assert(all(field(1:7) == 'factory'), sprintf('Field %s doesn''t begin with ''factory''.', field));
% end
