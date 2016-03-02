//////////////////////////////////////////////////////////
// FILE NAME MANIPULATION
//////////////////////////////////////////////////////////

// TODO: make these "ensure" functions better
function ensure_valid_location(str) {
  return $.trim(str);
}

// Takes a file path and gets only the name
function get_name(file_path) {
  var tail = file_path.split('/').pop();
  return tail;
}

function get_extension(name) {
  if (name.indexOf('.') < 0) {
    return '';
  } else {
    var two_extension = name.split('.').slice(-2).join('.');
    if (['tar.gz', 'tar.bz2'].indexOf(two_extension) >= 0) {
      return two_extension;
    } else {
      return name.split('.').slice(-1)[0];
    }
  }
}
