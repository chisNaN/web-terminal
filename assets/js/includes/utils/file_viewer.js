var FileViewer = function(files_placeholder, crumbs_placeholder, crumbs, callbacks) {
  this.crumbs_placeholder = crumbs_placeholder;
  this.files_placeholder = files_placeholder;

  this.files_placeholder.empty();
  this.crumbs_placeholder.empty();
  this.update_crumbs(crumbs);

  this.cd_callback = callbacks.cd_callback || function() {};
  this.select_callback = callbacks.select_callback || function() {};
  this.open_callback = callbacks.open_callback || function() {};

  if (crumbs === null) {
    this.crumbs = ['.'];
  } else {
    this.crumbs = crumbs;
  }

  this.selected = null;
};

FileViewer.prototype.cdUpTo = function(i) {
  this.crumbs.splice(i + 1, this.crumbs.length - i - 1);
  this.cd_callback(this.crumbs);
};

FileViewer.prototype.cdUp = function() {
  if (this.crumbs.length > 1) {
    this.crumbs.pop();
    this.cd_callback(this.crumbs);
  }
};

FileViewer.prototype.cdIn = function(name) {
  this.crumbs.push(name);
  this.cd_callback(this.crumbs);
};


FileViewer.prototype.update_crumbs = function(crumbs) {
  if (crumbs) {this.crumbs = crumbs;}

  this.crumbs_placeholder.empty();
  for(var k in this.crumbs) {
    var newLi;
    var name = (k !== 0) ? this.crumbs[k] : '<i class="fa fa-home"></i>&nbsp;';

    if (k < this.crumbs.length - 1) {
      newLi = $('<li>');
      var newCrumb = $('<a>').html(name).css('cursor', 'pointer');  // TODO Replace all these anchors
      newCrumb.click($.proxy(this.cdUpTo, this, parseInt(k)));
      newLi.append(newCrumb);
      newLi.append($('<span>').addClass('divider').text('>'));
    } else {
      newLi = $('<li>').addClass('active').html(name); // Current directory
    }
    this.crumbs_placeholder.append(newLi);
  }
};

FileViewer.prototype.add_file = function(info, options) {
  var name = info.name;
  var extension = get_extension(name);
  var is_dir = info.is_directory && (extension != 'cfig');
  var icon = (is_dir) ? 'fa fa-fw fa-folder-o' : 'fa fa-fw fa-file-o';

  var self = this;
  var isModal = this.files_placeholder.parents('.modal-dialog').size() > 0;
  var newRow = $('<tr>').append(
      $('<td>').addClass('file_name').append(
        $('<a>').append(
          $('<i>').addClass(icon),
          $('<span>').text(name)
        )
      ),
      (isModal ? $('<td>').addClass('file_size').text( is_dir ? '-' : formatBytes(info.size)) : null),
      (isModal ? $('<td>').addClass('file_mtime').text(moment(info.mtime).format('MMM D HH:mm')) : null)
    )
    .addClass('files_list file_tab_link')
    .data('name', name)
    .data('is_dir', is_dir)
    .data('crumbs', this.crumbs)
    .click(function() {
      self.select_file($(this));
      return false;
    })
    .dblclick(function() {
      self.open_file($(this));
      return false;
    });

  this.files_placeholder.append(newRow);
};

FileViewer.prototype.update_files = function(files, options) {
  // populate list of files in current directory
  files.sort(function(f1, f2) {
    var f1_is_dir = ((f1.is_directory) && (get_extension(f1.name) != 'cfig'));
    var f2_is_dir = ((f2.is_directory) && (get_extension(f2.name) != 'cfig'));
    if (f1_is_dir && (!f2_is_dir)) {return -1;}
    if ((!f1_is_dir) && f2_is_dir) {return 1;}
    return ((f1.name < f2.name)  ? -1 : 1);
  });

  this.files_placeholder.empty();
  var newRow = $('<tr>').addClass('files_list');
  var isModal = this.files_placeholder.parents('.modal-dialog').size() > 0;

  var self = this;
  if (this.crumbs.length > 1) {
    newRow.addClass('navigate_up');
    newRow.append(
      $('<td>').append(
        $('<a>').append(
          $('<i>').addClass('fa fa-arrow-left')
        )
      ),
      (isModal ? $('<td>') : null),
      (isModal ? $('<td>') : null)
    ).contextmenu(function() {
      return false;
    }).click(function() {
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
      } else {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
      }
      return false;
    })
    .dblclick(function() {
      $.proxy(self.cdUp, self)();
      return false;
    });
  }
  this.files_placeholder.append(newRow);

  for (var k in files) {
    this.add_file(files[k], options);
  }
};

FileViewer.prototype.open_file = function($link) {
  var name = $link.data('name');
  var is_dir = $link.data('is_dir');
  var is_in_modal = $link.closest('#modal_files').size() > 0;

  if (is_dir) {
    this.cdIn(name);
  } else {
    this.open_callback($link, this);
  }
}

FileViewer.prototype.select_file = function($link) {
  if ($link.hasClass('active')) {
    $link.removeClass('active');
  } else {
    $link.siblings().removeClass('active');
    $link.addClass('active');
  }
  this.select_callback($link, this);
}

