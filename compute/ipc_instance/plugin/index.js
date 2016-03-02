var path = require('path');
var PluginHandler = require('./handler').PluginHandler;

module.exports = { PluginHandler: PluginHandler };
var plugins = module.exports.plugins = {};

var defaultPlugins = [
  'plot',
  'editor',
  'files',
  'html',
  'chat',
  'meta',
];

// Expose default plugins
defaultPlugins.forEach(function(namespace) {
  var plugin = require(path.join(__dirname, namespace));
  plugins[namespace] = plugin;
});
