var path = require('path');
var constants = require('./constants');

// Unlabeled environments are considered production
var isDev = process.env.NODE_ENV !== 'production';

module.exports = function() {
  var CDN = constants.domain + '/assets/';
  var hash = constants.gitHead || '';
  var assetRelPath = constants.assetPath || 'assets';
  var assetPath = path.resolve(assetRelPath);

  // path.join disallows urls, so we must manually build the path
  //if (!/\/$/.test(CDN)) { CDN += '/'; }

  return {
    js: js,
    css: css,
  };

  /* FIXME: Assets must load in the correct order
   * 1. Add logic in application.js to enforce this order
   * 2. Add fallback locations from which to serve should CDN fail
   */
  function js(filename) {
    var paths = {};
    getJSFile(filename, paths);

    // Serve from CDN with local fallback
    if (!isDev) {
      return '<script src="' + CDN + paths.built + '"></script>';
    // Serve local files
    } else {
      var files;
      try {
        files = require(path.join(assetPath, 'js', paths.base + '.manifest.js'));
      } catch (e) {
        files = [paths.base + '.js'];
      }

      return files.map(function(filepath) {
        return '<script src="' + path.join(assetRelPath, 'js', filepath) + '"></script>';
      }).join('');
    }
  }

  function css(filename) {
    var paths = {};
    getCSSFile(filename, paths);

    // Serve from CDN with local fallback
    if (!isDev) {
      return '<link rel="stylesheet" href="' + CDN + paths.built + '" />';
    // Serve local files
    } else {
      return '<link rel="stylesheet" href="' + path.join(assetRelPath, 'css', paths.compiled) + '" />';
    }
  }

  function getJSFile(filename, paths) { return getFile('js', filename, paths); }
  function getCSSFile(filename, paths) { return getFile('css', filename, paths); }
  function getFile(type, filename, paths) {
    var extname = /\.manifest\.json$/.test(path) ? 'manifest.json' : path.extname(filename);
    var basepath = path.join(
      require('path').dirname(filename),
      require('path').basename(filename, extname)
    );

    // path.join disallows urls, so we must manually build the path
    if (/^\//.test(basepath)) { basepath = basepath.slice(1); }

    paths.base = basepath;
    paths.built = basepath + hash + '.min.' + type;
    paths.compiled = basepath + '.compiled.' + type;
  }
};
