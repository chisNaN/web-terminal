//////////////////////////////////////////////////////////
// FORMATTING
//////////////////////////////////////////////////////////

function formatBytes (size) {
  var units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var bytes = size;
  var display;

  for (var i = 0; bytes >= 1000 && i < 4; i++) {
    bytes /= 1000;
  }

  display = (i === 0) ? bytes : bytes.toFixed(2);
  return display + ' ' + units[i];
}
