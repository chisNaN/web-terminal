function Upload(file, callback) {
  this.callback = callback;
  this.checksum = CryptoJS.algo.SHA1.create();
  this.file = file;
  this.size = file.size;
  this.uid = file.uid;
  this.upload_path = file.upload_path;

  this.name = this.file.path || this.file.webkitRelativePath || this.file.name;
  this.file.slice = file.slice || file.webkitSlice || file.mozSlice;

  this.url = '/upload?upload_uid=' + this.uid +
    '&upload_path=' + encodeURIComponent(this.upload_path);
  this.errorCount = 0;
  this.currentChunk = 1;
  this.chunk_size = (1000 * 768); // 768KB
  this.chunkRange = (this.size == 0) ? [0,0] : getChunks(this.size, this.chunk_size);
  this.range_start = this.chunkRange[0];
  this.range_end = this.chunkRange[1];
  this.updateStats();

  return this.begin();
}

Upload.prototype.begin = function() {
  this.is_paused = false;
  this.is_started = true;

  this.request = new XMLHttpRequest();
  this.request.upload.uid = this.uid;

  // Set event handlers
  this.request.upload.addEventListener('progress', clientProgress, false);
  this.request.addEventListener('load', chunkComplete, false);
  this.request.addEventListener('error', uploadFailed, false);
  this.request.addEventListener('abort', uploadCanceled, false);

  // Start the upload
  this._upload(this.currentChunk);
};

Upload.prototype.getChunk = function(chunkNumber) {
  this.range_start = this.chunkRange[chunkNumber-1];
  this.range_end = this.chunkRange[chunkNumber];

  return this.file.slice(this.range_start, this.range_end);
};

Upload.prototype._upload = function(chunkNumber) {
  var self = this;
  var reader = new FileReader();
  var chunk = this.getChunk(chunkNumber);

  this.request.open('POST', this.url, true);
  this.setHeaders(chunk.size, chunkNumber);
  this.send(chunk);
};

Upload.prototype.setHeaders = function(chunkSize, chunkNumber) {
  if (this.file.type) {
    //this.request.overrideMimeType(this.file.type);
    this.request.setRequestHeader('Content-Type', this.file.type);
  }

  this.request.setRequestHeader('Content-Range', 'bytes ' + this.range_start + '-' + this.range_end + '/' + this.size);
  this.request.setRequestHeader('Chunk-Total', (this.chunkRange.length-1 < 1) ? 1 : this.chunkRange.length-1);
  this.request.setRequestHeader('Chunk-Size', chunkSize);
  this.request.setRequestHeader('Chunk-Number', chunkNumber);
  this.request.setRequestHeader('File-Path', this.name);
};

Upload.prototype.send = function(chunk) {
  var self = this;
  var reader = new FileReader();
  var date = new Date().getTime();

  reader.readAsArrayBuffer(chunk);
  reader.onloadend = function (evt) {
    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
      try {
        var buffer = new Uint8Array(evt.target.result);
        var array = CryptoJS.lib.WordArray.create(buffer);
        var hash = CryptoJS.SHA1(array).toString();

        self.checksum.update(array);

        if (self.currentChunk == self.chunkRange.length -1) {
          self.checksum = self.checksum.finalize().toString();
          self.request.setRequestHeader('File-Hash', self.checksum);
        }
        self.request.setRequestHeader('Chunk-Hash', hash);

        if (!!~window.navigator.userAgent.indexOf('Chrome')) {
          self.request.send(buffer);
        } else {
          self.request.send(evt.target.result);
        }
      } catch (e) {
        self.cancel('danger', 'experienced ' + e);
      }
    }
  };
};

Upload.prototype.pause = function() {
  var progressBar = document.getElementById(this.uid + '-pbar');

  progressBar.className = 'progress-bar progress-bar-warning';
  progressBar.parentNode.className = 'progress';

  document.getElementById(this.uid + '-resume').style.display = '';
  document.getElementById(this.uid + '-pause').style.display = 'none';

  this.is_paused = true;
  return;
};

Upload.prototype.resume = function() {
  var progressBar = document.getElementById(this.uid + '-pbar');

  progressBar.className = 'progress-bar';
  progressBar.parentNode.className = 'progress progress-striped active';

  document.getElementById(this.uid + '-pause').style.display = '';
  document.getElementById(this.uid + '-resume').style.display = 'none';

  this.is_paused = false;

  if (this.currentChunk < this.chunkRange.length) {
    return this._upload(this.currentChunk);
  }
};

Upload.prototype.cancel = function(status, outcome) {
  var tableRow = document.getElementById(this.file.uid + '-row');
  var alertsContainer = document.getElementById('upload_alerts');

  delete uploads[this.uid];
  this.is_cancelled = true;

  tableRow.parentNode.removeChild(tableRow);
  return this.callback();
};

Upload.prototype.continue = function(fileHash) {
  this.currentChunk++;
  if (this.currentChunk < this.chunkRange.length && !this.is_paused && !this.is_cancelled) {
    this._upload(this.currentChunk);
  }

  if (this.currentChunk == this.chunkRange.length) {
    if (fileHash !== this.checksum) {
      this.cancel('danger', 'experienced an error on the server. Please retry uploading.');
    }
    this.callback();
    return delete uploads[this.uid];
  }
};

Upload.prototype.updateStats = function() {
  var tableRow = document.getElementById(this.uid + '-row');
  var alertsContainer = document.getElementById('upload_alerts');
  var percent = Math.round(100 * this.chunkRange[this.currentChunk-1] / this.chunkRange[this.chunkRange.length-1]);
  var pDisplay;
  var rDisplay;

  if (this.size == 0) {
    percent = 100;
  }

  if (tableRow && this.currentChunk == 1) {
    tableRow.innerHTML = initialTemplate(this.uid, this.name, formatBytes(this.size), percent);
  } else {
    try {
      $('#' + this.uid + '-pbar').css('width', percent + '%').attr('aria-valuenow', percent);
      document.getElementById(this.uid + '-%').innerHTML = percent;
    } catch(e) {
      //console.log(e);
    }
  }
  if (this.is_paused) {
    this.pause();
  }

  if (percent == 100 && tableRow) {
    tableRow.parentNode.removeChild(tableRow);
  }
};

//
//  Upload XHR event handlers
//

function clientProgress (ev) {
  if (ev.lengthComputable) {

    var percentComplete = Math.round(ev.loaded * 100 / ev.total);
    var upload = uploads[this.uid];

    //console.log(100 * (upload.chunkRange[upload.currentChunk-1] + ev.loaded) / upload.size)
    //document.getElementById(this.uid).style.width = percentComplete + '%';
  }
}

function chunkComplete (ev) {
  var res = JSON.parse(ev.target.responseText);
  var upload = uploads[this.upload.uid];

  if (!upload) {
    return;
  }
  //console.log(res);
  switch (res.status) {
    case 'success':
      upload.errorCount = 0;
      upload.continue(res['file-hash']);
      break;
    case 'failure':
       console.log('Hash mismatch in file:', upload.name,
                   ', on chunk', res.chunkNumber, 'of', res.expectedChunks, '. ',
                   'Trying', 10 - upload.errorCount, 'more time(s).');
      upload.errorCount++;
      if (upload.errorCount > 9) {
        uploadFailed(upload);
        console.log('Hash mismatch in file:', upload.name, ',',
                    'on chunk', res.chunkNumber, '/', res.expectedChunks + ',',
                    '10 consecutive times. Cancelling upload.');
      } else {
        upload._upload(res.chunkNumber);
      }
      break;
    case 'error':
      uploadFailed(upload);
      break;
    default:
      break;
  }

  return upload.updateStats();
}

function uploadFailed(upload) {
  var tableRow = document.getElementById(upload.uid + '-row');
  var alertsContainer = document.getElementById('upload_alerts');

  upload.is_cancelled = true;

  alertsContainer.innerHTML += alertTemplate(
    (upload.name) ? upload.name : '', 'danger', 'experienced an error while trying to upload.');
  return (tableRow) ? tableRow.parentNode.removeChild(tableRow) : false;
}

function uploadCanceled(ev) {
  var tableRow = document.getElementById(this.upload.uid + '-row');
  var alertsContainer = document.getElementById('upload_alerts');

  this.is_cancelled = true;

  alertsContainer.innerHTML += alertTemplate(
    this.file.name, 'warning', 'has been canceled or your browser has dropped the connection.');
  return tableRow.parentNode.removeChild(tableRow);
}

//
//  Helper functions
//

function getChunks(fileSize, chunkSize) {
  var chunkRange = [];
  var numOfChunks = Math.floor(fileSize/chunkSize);
  for (var i = 0; i <= numOfChunks; i++) {
    chunkRange.push(i*chunkSize);
  }
  if (fileSize/chunkSize % 1) {
    chunkRange.push(fileSize);
  }
  return chunkRange;
}

function formatBytes(size) {
  var units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var bytes = size;

  for (i = 0; bytes >= 1000 && i < 4; i++) {
    bytes /= 1000;
  }

  return bytes.toFixed(2) + ' ' + units[i];
}