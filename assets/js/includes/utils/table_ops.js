function get_csv_data(contents) {
  var k;
  var row;
  var data = [];
  var rows = contents.split('\n');
  var max_row_size = 0;
  for (k in rows) {
    row = rows[k].split(',');
    data.push(row);
    if (row.length > max_row_size) {
      max_row_size = row.length;
    }
  }
  for (k in data) {
    row = data[k];
    while (row.length < max_row_size) {
      row.push('');
    }
  }
  return data;
}

function set_spreadsheet_data(div, data, onchange, options) {
  var cells;
  if (!onchange) {
    onchange = function(changes, source) {};
  }
  if (options && options.read_only) {
    cells = function(r,c, prop) {
        return {readOnly : true};
    };
  } else {
    cells = function(r, c, prop) {
      return {};
    };
  }

  div.handsontable({
    contextMenu: true,
    data: data,
    rowHeaders: true,
    colHeaders: true,
    manualColumnResize: true,
    startRows: 100,
    startCols: 100,
    cells: cells,
    onChange: onchange

  });
}

