function cellarr = __ensure_iscell__(cellarr)
  if ~iscell(cellarr)
    cellarr = mat2cell(cellarr, ones(1, size(cellarr, 1)), ones(1, size(cellarr, 2)));
  end
endfunction
