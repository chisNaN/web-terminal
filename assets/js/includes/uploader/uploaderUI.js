/* jshint -W043 */

$('#upload_files, #upload_folder').bootstrapFileInput();

var uploadList = document.getElementById('upload_list');
var uploads = {};

var q = async.queue(function (file, callback) {
  uploads[file.uid] = new Upload(file, callback);
}, 8);

// File selection event listener
document.getElementById('upload_files').addEventListener('change', function (evt) {
  return handleSelectedFiles(evt.target.files);
}, false);

// Folder selection event listener
document.getElementById('upload_folder').addEventListener('change', function (evt) {
  return handleSelectedFiles(evt.target.files);
}, false);

// Upload button event handlers

function pause(ev) {
  var id = ev.getAttribute('id').replace('-pause','');
  uploads[id].pause();
}

function resume(ev) {
  var id = ev.getAttribute('id').replace('-resume','');
  uploads[id].resume();
}

function cancel(ev) {
  var id = ev.getAttribute('id').replace('-cancel','');
  uploads[id].cancel('warning', 'has been canceled.');
}

// Drag and drop event listeners
document.getElementById('drag_and_drop').addEventListener('dragenter', dragenter, false);
document.getElementById('drag_and_drop').addEventListener('dragleave', dragleave, false);
document.getElementById('drag_and_drop').addEventListener('dragover', dragenter, false);
document.getElementById('drag_and_drop').addEventListener('drop', drop, false);

//
// Drag and drop event handlers
//

function dragenter(ev) {
  ev.preventDefault();
}

function dragleave(ev) {
  ev.stopPropagation();
  ev.preventDefault();
}

function drop(ev) {
  ev.stopPropagation();
  ev.preventDefault();

  if (!!~window.navigator.userAgent.indexOf('Chrome')) {
    handleSelectedFolders(ev.dataTransfer.items);
  } else {
    handleSelectedFiles(ev.dataTransfer.files);
  }
}

//
//  File selection event handler
//

function handleSelectedFiles(files, path) {
  if (files.length === 0) {
    // files is an empty file list
    return;
  } else if (files.length) {
    // files is a populated file list
    for (var i = 0; i < files.length; i++) {
      startUploading(files[i]);
    }
  } else {
    // files happens to be just one file right now
    // only set path property if file is in an uploaded directory.
    if (path !== '/' + files.name) {
      files.path = path;
    }
    startUploading(files);
  }
  return false;
}

//
//  Folder selection event handler
//

function handleSelectedFolders(files) {
  var length = files.length;
  for (var i = 0; i < length; i++) {
    var entry = files[i].webkitGetAsEntry();
    findFiles(entry);
  }
}

function parseDirectory(dir) {
  var dirReader = dir.createReader();

  dirReader.readEntries(function(fileList) {
    for (var i = 0; i < fileList.length; i++) {
      findFiles(fileList[i]);
    }
  }, errorHandler);
}

//
//  Helper functions
//

function findFiles(entry) {
  if (entry.isFile) {
    entry.file(function(file) {
      handleSelectedFiles(file, entry.fullPath);
    }, errorHandler);
  } else if (entry.isDirectory) {
    parseDirectory(entry);
  }
}

function startUploading(file) {
  //skip the placeholder file "."
  if (file.name == '.') {
    return;
  }

  file.uid = uuid();
  file.upload_path = FilesManager.getCurDir() + '/';

  var div = document.createElement('div');
  div.id = file.uid+'-row';
  uploadList.appendChild(div);

  q.push(file, function(err) {
    //console.log(file.name, 'complete');
  });
}

String.prototype.supplant = function(o) {
    return this.replace(/{([^{}]*)}/g,
        function(a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

(function disableFolderUpload() {
  if (!(!!~window.navigator.userAgent.indexOf('Chrome'))) {
    document.getElementById('upload_folder').style.display = 'none';
  }
})();

function errorHandler(err) {
  if (err) {
    throw err;
  }
}

//
//  Templates
//

function initialTemplate(uid, name, size, percent) {
  return '\
      <div class="actions">\
        <span class="filename">{name}</span> &middot;\
        <a href="#" id="{uid}-pause" onclick="pause(this)">Pause</a>\
        <a href="#" id="{uid}-resume" style="display: none;" onclick="resume(this)">Resume</a> &middot;\
        <a href="#" id="{uid}-cancel" onclick="cancel(this)">Cancel</a>\
      </div>\
      <div class="progressbar">\
        <div class="progress progress-striped active">\
          <div id="{uid}-pbar" class="progress-bar" style="width: {percent}%">\
            <span class="sr-only">{percent}% Complete</span>\
          </div>\
        </div>\
      </div>'.supplant({uid: uid, name:name, size:size, percent:percent});
}

function alertTemplate(name, status, outcome) {
  return '<div class="alert alert-{status} alert-dismissable">\
            <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>\
            <strong>{name}</strong> upload {outcome}\
        </div>'.supplant({name: name, status: status, outcome: outcome})
}