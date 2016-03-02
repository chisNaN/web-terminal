/* jshint -W117 */

(function(exports) {

exports.cur_dir = ['/'];
exports.getCurDir = function() {
  return exports.cur_dir.join('/').replace(/^\/\//, '/');
};

$(document).ready(function(){
  exports.show();

  show_loading_modal($('#files_container'), 'files_list_loading');

  var socket = get_socket('files');

  function moveFile(path, new_path) {
    var id = show_loading_modal($('#files_container'));
    socket.emit('message', {
      from: 'files',
      to: 'computer',
      type: 'move',
      passback: '0',
      old_path: path,
      new_path: new_path,
      loading_id: id
    });
  }

  function copyFile(path, new_path) {
    var id = show_loading_modal($('#files_container'));
    socket.emit('message', {
      from: 'files',
      to: 'computer',
      type: 'copy',
      passback: '0',
      old_path: path,
      new_path: new_path,
      loading_id: id
    });
  }

  function removeFile(path, is_dir) {
    var id = show_loading_modal($('#files_container'));
    socket.emit('message', {
      from: 'files',
      to: 'computer',
      type: 'remove',
      passback: '0',
      path: path,
      is_dir:is_dir,
      loading_id: id
    });
  }

  // TODO:  Warn if using existing file/folder name
  // (chown will actually work incorrectly!  do this for upload from URL too)
  function newFile() {
    trigger_files_modal($('body'), {action: 'New File', input_default: '', focus_name_input: true},
                        exports.cur_dir.slice(0),
                        modal_file_viewer,
                        function(crumbs, name) {
                          var path = ensure_valid_location(crumbs.join('/') + '/' + name);
                          socket.emit('message', {
                            from: 'files',
                            to: 'computer',
                            type: 'put',
                            passback: '0',
                            path: path,
                            value: '',
                            is_dir:false
                          });
                        });
  }
  exports.newFile = newFile;
  $('#create_file').click(newFile);

  function newFolder() {
    trigger_files_modal($('body'), {action: 'New Folder', input_default: '', focus_name_input: true},
                        exports.cur_dir.slice(0),
                        modal_file_viewer, function(crumbs, name) {
                          var path = ensure_valid_location(crumbs.join('/') + '/' + name);
                          socket.emit('message', {
                            from: 'files',
                            to: 'computer',
                            type: 'put',
                            passback: '0',
                            path: path,
                            value: '',
                            is_dir:true
                          });
                        });
  }
  exports.newFolder = newFolder;
  $('#create_folder').click(newFolder);

  $('#file_search_input').keyup(function() {
    var search_input= $('#file_search_input').val();
    $('#search_files').empty();
    if (search_input.length === 0) {
      $('#search_files').hide();
      $('#myFiles').show();
      // put an icon?
    }  else {
      $('#search_files').show();
      $('#myFiles').hide();
      var id = show_loading_modal($('#files_container'));
      socket.emit('message', {
        from: 'files',
        to: 'computer',
        type: 'find',
        input: search_input,
        client_id: client_id,
        loading_id: id,
        path: exports.cur_dir.join('/')
      });
    }
  });

  $('#search_files').hide();
  var search_file_viewer = new FileViewer($('#search_files'), $('#dummy'), ['/'], {
    //select_callback: select_callback,
    //open_callback: open_callback
  });

  exports.cd = function(path) {
    socket.emit('message', {
      from: 'files',
      to: 'computer',
      type: 'list',
      passback: 'main',
      path: path
    });
    show_loading_modal($('#files_container'),
                       'files_list_loading');
  };

  function cd_callback(crumbs) {
    var path = crumbs.join('/');
    exports.cd(path);
  }
  var file_viewer = new FileViewer($('#myFiles'), $('#myCrumbs'), exports.cur_dir, {
    cd_callback: cd_callback,
    select_callback: browser_select_callback,
    open_callback: browser_open_callback
  });

  function modal_select_callback($link) {
    var active = $link.hasClass('active');
    var modal = $link.closest('.modal');
    var name = $link.data('name');
    if (active) {
      modal.find('#files_modal_input').val(name);
    }
  }

  function browser_select_callback($link) {
    var active = $link.hasClass('active');
    var files_toolbar = $link.closest('.panel').find('#files_toolbar');
    var active_file_toolbar = $link.closest('.panel').find('#active_file_toolbar');
    var files_buttons;
    if ($link.data('is_dir')) {
      files_buttons = _get_folder_buttons($link);
    } else {
      files_buttons = _get_file_buttons($link);
    }

    if (active) {
      files_toolbar.hide();
      active_file_toolbar.empty().show();
      for (var i = 0; i < files_buttons.length; i++) {
        var btn = make_button(files_buttons[i]);
        btn.appendTo(active_file_toolbar);
      }
    } else {
      files_toolbar.show();
      active_file_toolbar.hide();
    }
  }

  function modal_open_callback($link) {
    var modal = $link.closest('.modal');
    modal.find('#files_modal_submit').click();
  }

  function browser_open_callback($link) {
    var name = $link.data('name');
    var crumbs = $link.data('crumbs');
    var file_extension = get_extension(name);
    var path = crumbs.join('/') + '/' + name;
    var url = get_file_url(path);
    if (file_extension in image_types) {
      // TODO: Cache these IDs so we don't have to post the second time?
      window.open(url);
      //show_image_modal(url);
    } else if (file_extension in pdf_types) {
      window.open(url);
      //show_main_modal('<embed src="' + url + '" width="500px" height="500px"></embed>');

    } else if (file_extension in video_types) {
      // TODO: Cache these IDs so we don't have to post the second time?
      //show_main_modal('<video width="320" height="240" controls="controls"><source src="' + url + '"/></video>');
      window.open(url);
    } else if (file_extension in compress_types) {
      var id = show_loading_modal($('#files_container'));
      socket.emit('message', {
        from: 'files',
        to: 'computer',
        type: 'uncompress',
        passback: '0',
        path: path,
        dir: crumbs.join('/')+'/',
        extension: file_extension,
        loading_id: id
      });
    } else if (file_extension in cfig_types) {
      socket.emit('message', {
        from: 'files',
        to: 'computer',
        type: 'loadfig',
        passback: '0',
        path: path
      });
    //} else if ((file_extension in text_types) || (file_extension in tabular_types)){
    } else {
      // default
      //show_main_modal(text_box('Don't know what to do with this file type.'));
      var id2 = show_loading_modal($('#editor_container'));
      EditorManager.open_file(path, {
        loading_id: id2,
        reload: false
      });
    }
  }

  function get_path_from_name(name) {
    var path = exports.cur_dir.join('/') + '/' + name;
    while ((path[0] == '/') && (path[1] == '/')) {
    //while (path && (path[0] == '/')) {
      path = path.slice(1);
    }
    return path;
  }

  function trigger_open_file(trigger) {
    $('span', trigger).dblclick();
  }

  function trigger_browse_file(trigger) {
    var is_dir = $(trigger).data('is_dir');
    var name = $(trigger).data('name');
    var path = get_path_from_name(name);
    if (path[0] == '/') {
      path = path.slice(1);
    }
    if (is_dir) {
      path += '/';
    }
    HtmlManager.new_frame({url: 'localhost' + _SERVE_FILES_PATH + '/' + path});
  }

  function trigger_delete_file(trigger) {
    var is_dir = $(trigger).data('is_dir');
    var name = $(trigger).data('name');
    var path = get_path_from_name(name);
    var extension = get_extension(name);
    confirm_modal($('body'), 'Are you sure?', function (bool) {
      if (bool) {
        removeFile(path, (is_dir || (extension == 'cfig')));
      }
    });
  }

  function trigger_move_file(trigger) {
    var name = $(trigger).data('name');
    var path = get_path_from_name(name);
    trigger_files_modal($('body'), { action: 'Move Here', input_default: name, focus_name_input: true},
                        exports.cur_dir.slice(0),
                        modal_file_viewer,
                        function(crumbs, name) {
                          var new_path = ensure_valid_location(crumbs.join('/') + '/' + name);
                          moveFile(path, new_path);
                        });
  }

  function trigger_copy_file(trigger) {
    var name = $(trigger).data('name');
    var path = get_path_from_name(name);
    var copy_name = name + ' copy';
    trigger_files_modal($('body'), {action: 'Copy Here', input_default: copy_name, focus_name_input: true},
                        exports.cur_dir.slice(0),
                        modal_file_viewer,
                        function(crumbs, name) {
                          var new_path = ensure_valid_location(crumbs.join('/') + '/' + name);
                          copyFile(path, new_path);
                        });
  }

  function trigger_download_file(trigger) {
    var full_url;
    var name = $(trigger).data('name');
    var path = get_path_from_name(name);
    var is_dir = $(trigger).data('is_dir');
    if (is_dir) {
      // post a command to tar, and
      full_url = server_url + '/download/' + encodeURIComponent(path);
    } else {
      full_url = get_download_url(path);
    }
    logEvent({'type': 'download', 'url':full_url});
    window.location.assign(full_url);
  }


  var trigger_dict = {
    'Open': trigger_open_file,
    'Delete': trigger_delete_file,
    'Move': trigger_move_file,
    'Copy': trigger_copy_file,
    'Browse': trigger_browse_file,
    'Download': trigger_download_file
  };

  var contextMenuBuild = function(trigger, e) {
    var $link = $(trigger).closest('.file_tab_link');

    if ($link.closest('#modal_files').size() > 0) {
      $link.siblings().removeClass('active');
      modal_select_callback($link);
    } else {
      $link.siblings().removeClass('active');
      browser_select_callback($link);
    }

    var is_dir = $link.data('is_dir');
    var open_icon = (is_dir ? 'fa fa-fw fa-folder-open' : 'fa fa-fw fa-edit');
    return {
      callback: function(key, options) {
        if (key in trigger_dict) {
          trigger_dict[key]($link);
        } else {
          var m = 'Sorry!  The ' + key + ' feature is not yet implemented';
          show_main_modal(text_box(m));
        }
      },
      items: {
        'Open':     {name: '<i class="' + open_icon + '"></i> Open'},
        'Move':     {name: '<i class="fa fa-fw fa-paste"></i> Move'},
        'Copy':     {name: '<i class="fa fa-fw fa-copy"></i> Copy'},
        'Download': {name: '<i class="fa fa-fw fa-download"></i> Download'},
        'Browse':   {name: '<i class="fa fa-fw fa-external-link"></i> Browse'},
        'Delete':   {name: '<i class="fa fa-fw fa-trash-o"></i> Delete'},
      }
    };
  };

  // Context-Menu with Sub-Menu
  try {
    $.contextMenu({
      selector: '.file_tab_link',
      build: contextMenuBuild,
      zIndex: 100,
      animation: {
        duration: 0,
        show: 'show',
        hide: 'hide'
      }
    });
  } catch (err) {
    console.log('ERROR INITIALIZING CONTEXT MENU');
  }

  function _get_folder_buttons(trigger) {
    return [
      {
        icon: 'fa fa-fw fa-paste',
        text: 'Move Folder',
        click: function() { trigger_move_file(trigger); }
      },
      {
        icon: 'fa fa-fw fa-copy',
        text: 'Copy Folder',
        click: function() { trigger_copy_file(trigger); }
      },
      {
        icon: 'fa fa-fw fa-download',
        text: 'Download Folder',
        click: function() { trigger_download_file(trigger); }
      },
      {
        icon: 'fa fa-fw fa-trash-o',
        text: 'Delete Folder',
        click: function() { trigger_delete_file(trigger); }
      }
    ];
  }

  function _get_file_buttons(trigger) {
    return [
      {
        icon: 'fa fa-fw fa-file',
        text: 'Open',
        click: function() { trigger_open_file(trigger); },
        withSeparator: true,
        withText: true
      },
      {
        icon: 'fa fa-fw fa-external-link',
        text: 'Browse',
        click: function() { trigger_browse_file(trigger); },
        withSeparator: true,
        withText: true
      },
      {
        icon: 'fa fa-fw fa-paste',
        text: 'Move',
        click: function() { trigger_move_file(trigger); }
      },
      {
        icon: 'fa fa-fw fa-copy',
        text: 'Copy',
        click: function() { trigger_copy_file(trigger); }
      },
      {
        icon: 'fa fa-fw fa-download',
        text: 'Download',
        click: function() { trigger_download_file(trigger); }
      },
      {
        icon: 'fa fa-fw fa-trash-o',
        text: 'Delete',
        click: function() { trigger_delete_file(trigger); }
      }
    ];

  }

  $('#files_modal').click(function() {
    $(this).find('tbody.files_list tr').removeClass('active');
  });

  $(window).click(function() {
    var panel = $('#files_container');
    panel.find('tbody.files_list tr').removeClass('active');
    panel.find('#files_toolbar').show();
    panel.find('#active_file_toolbar').hide();
  });

  socket.on('message', function(msg) {handle_message(msg);});

  function path_to_crumbs(path) {
    var crumbs = [];
    if (path[0] == '/') {
      crumbs.push('/');
    }
    var parts = path.split('/');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part.length > 0) {
        crumbs.push(part);
      }
    }
    return crumbs;
  }

  function modal_cd_callback(crumbs) {
    socket.emit('message', {
      from: 'meta',
      to: 'computer',
      type: 'list',
      passback: 'modal',
      path: crumbs.join('/'),
      client_id: client_id
    });
    show_loading_modal($('#files_modal'), 'modal_files_list_loading');
  }
  modal_file_viewer = new FileViewer($('#modal_files'), $('#modal_crumbs'), ['/'], {
    cd_callback: modal_cd_callback,
    select_callback: modal_select_callback,
    open_callback: modal_open_callback
  });

  $('#modal_create_folder').click(function() {
    //input_modal(pane, text, placeholder, callback)
  });

  function handle_message(msg) {
    if (msg.type == 'list') {
      if ((!msg.client_id) || (msg.client_id == client_id)) {
        if (!msg.passback) {msg.passback = 'main';}

        logEvent({type: 'received_list', message: msg});

        hide_loading_modal('files_list_loading');
        var session_files = {};
        var files = JSON.parse(msg.result);
        for(var i=0; i<files.length; ++i) {
          var f = files[i].name;
          var d = files[i].is_directory;
          var name = get_name(f);
          if (name[0] == '.') { continue; }
          session_files[f] = f;
        }

        var crumbs = path_to_crumbs(msg.path);
        if (msg.passback == 'main') {
          exports.cur_dir = crumbs;
          // already updated crumbs if this was the client who triggered this, but try again anyways
          file_viewer.update_crumbs(exports.cur_dir);
          file_viewer.update_files(files);
        } else if (msg.passback == 'modal') {
          modal_file_viewer.update_crumbs(crumbs);
          modal_file_viewer.update_files(files);
        } else if (msg.passback == 'search') {

        } else {
          console.log('NOT SURE WHERE TO LIST:' , JSON.stringify(msg));
        }
      }
    } else if (msg.type == 'hide_files_list_loading') {
      hide_loading_modal('files_list_loading');
    } else if (msg.type == 'list_error') {
      show_error('Error listing ' + msg.path + '\n' +  msg.error + '\n' + 'Resetting to /');
      socket.emit('message', {
        from: 'files',
        to: 'computer',
        type: 'list',
        passback:msg.passback,
        path: '/'
      });
      hide_loading_modal('files_list_loading');
    } else if (msg.type == 'find_result') {
      var info = JSON.parse(msg.info);
      info.name = msg.file;
      search_file_viewer.add_file(info,  function(crumbs, name) {
        // TODO
      });
    } else if (msg.type == 'hello') {
      // TODO: do something?
    } else if (msg.type == 'hide_loading') {
      hide_loading_modal(msg.loading_id);
    } else {
      console.log('UNHEARD MESSAGE:', msg);
    }
  }
});

})(FilesManager);
