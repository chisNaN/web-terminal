/* eslint-env node */

module.exports = [
  'util/socket.io.js',
  'util/dateformat.js',
  'util/jquery.js',
  'util/jquery-ui.min.js',
  'util/jquery.cookie.js',
  'util/underscore.js',
  'util/uuid.js',
  'util/queue.js',
  'util/sha1.js',
  'util/sha3.js',
  'util/lib-typedarrays-min.js',
  'util/async.js',
  'util/moment.min.js',
  'util/bootstrap.min.js',
  'util/bootstrap.file-input.js',

  'lib/jquery-handsontable/jquery.handsontable.full.js',
  'lib/jQuery-contextMenu/src/jquery.ui.position.js',
  'lib/jQuery-contextMenu/prettify/prettify.js',
  'lib/jQuery-contextMenu/screen.js',
  'lib/jQuery-contextMenu/src/jquery.contextMenu.js',
  'lib/html2canvas.js',
  'lib/iframeResizer.min.js',
  'lib/feedback.js/feedback.js',
  'lib/ga.js',

  'includes/utils/modals.js',
  'includes/init.js',

  'includes/utils/table_ops.js',
  'includes/utils/button_toolbar.js',
  'includes/utils/constants.js',
  'includes/utils/file_viewer.js',
  'includes/utils/files.js',
  'includes/utils/formatting.js',
  'includes/utils/logging.js',
  'includes/utils/placement.js',
  'includes/utils/string.js',

  'includes/manager/index.js',
  'includes/manager/socket/index.js',
  'includes/manager/hotkey/index.js',
  'includes/manager/panel/index.js',
  'includes/manager/layout/layout_mgr/layout_mgr.js',
  'includes/manager/layout/layout_compute.js',

  'includes/uploader/upload.js',
  'includes/uploader/uploaderUI.js',

  // Note: hotkeys must be loaded before terminal
  'includes/manager/hotkey/hotkeys.js',

  // TODO: Properly include this in the bundle
  'src/plugin/newPlot.js',
  'bundle.js',

  'util/browserTest.js',
];

