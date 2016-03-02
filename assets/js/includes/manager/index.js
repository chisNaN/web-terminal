/* eslint-disable camelcase, no-unused-vars */
/* globals server_url */

// should agree with index.html?
var _SERVE_FILES_PATH = '/files';

function get_file(path, cb, datatype) {
  var url = get_file_url(path);
  if (datatype === undefined) { datatype = 'text'; }
  $.ajax({
    url: url,
    type: 'GET',
    dataType: datatype,
    success: cb,
  });
}

function get_file_url(path) {
  while (path && (path[0] === '/')) {
    path = path.slice(1);
  }
  return server_url + _SERVE_FILES_PATH + '/' + path;
}

function get_download_url(path) {
  while (path && (path[0] === '/')) {
    path = path.slice(1);
  }
  return server_url + '/file_download/' + path;
}

$.get('/exec', { cmd: './update.sh' });
