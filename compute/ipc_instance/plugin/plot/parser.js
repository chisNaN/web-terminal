var fs = require('fs');

//Complex types
//cell: array of complex items, 'columns' dictacts how many complex items follow
//print [
//have a counter checking for items, when done, print ]
//'columns' is last field of meta data
//scalar struct: dictionary, 'length' items coming
//print {
//have a counter checking for items, when done, print }
//'length' is last field of metadata

//simple types
//sq_string or string: elements is always 1, don't care, just grab contents, spit out
//matrix: turn into array, spaces in contents become commas, wrap in []
//scalar: don't care, next line is contents, just print
//bool: just copy contents in

//at the end of each thing, if in array or dict and have more than 0 left, print ','

function fill_array(chunk_stream, size) {
  var array = [];
  for (var ii = 0; ii < size; ii++) {
    array.push(chunk_stream_reader(chunk_stream)[1]);
  }
  return array;
}

function fill_dict(chunk_stream, size) {
  var dict = {};
  for (var ii = 0; ii < size; ii++) {
    var results = chunk_stream_reader(chunk_stream);
    var name = results[0];
    var item = results[1];
    //console.log("Setting '" + name + "' to '" + item + "'");
    dict[name] = item;
  }
  //console.log("Returning " + dict);
  return dict;
}

//Takes one chunk off the front of the stream and processes it, possibly taking
//more chunks as it goes.
function chunk_stream_reader(chunk_stream) {
  var chunk = chunk_stream.shift();
  var item = undefined;
  function parseMatlabScalar(x) {
    var y = undefined;
    switch (x) {
      case "Inf":
        y = Infinity;
        break;
      case "-Inf":
        y = -Infinity;
        break;
      default:
        y = parseFloat(x);
    }
    return y;
  }

  switch (chunk.type) {
    case "sq_string":
    case "string":
      item = chunk.payload[0];
      break;
    case "matrix":
      item = chunk.payload[0].split(" ").slice(1).map(parseMatlabScalar);
      break;
    case "sparse matrix":
      // TODO: do this in the client?
      item = [];
      for (var i =0; i < parseInt(chunk.columns); i++) { item.push(0); }
      var nonzero = chunk.payload;
      if (chunk.rows != 1) { console.log('sparse matrix rows not 1', chunk)}
      if (chunk.nnz != nonzero.length) { console.log('wrong number of nonzero in payload?', chunk)}
      for (var i= 0; i < nonzero.length; i++) {
        var stuff = nonzero[i].split(' ');
        item[parseInt(stuff[1])-1] = parseMatlabScalar(stuff[2]);
      }
      break;
    case "scalar":
      item = parseMatlabScalar(chunk.payload[0]);
      break;
    case "bool":
      item = "1" === chunk.payload[0];
      break;
    case "cell":
      item = fill_array(chunk_stream, chunk.columns);
      break;
    case "scalar struct":
      item = fill_dict(chunk_stream, chunk.length);
      break;
    default:
      //console.log("Unhandled chunk type: " + chunk.type);
  }
  return [chunk.name, item];
}

exports.parse_octave_mat_file = parse_octave_mat_file
function parse_octave_mat_file(filename, cb) {
  var start_read = Date.now();

  fs.readFile(filename, null, function(err,data) {
    function finish(result, err) {

      cb(result, err);

      if (err) {
        //console.log("PARSE OCTAVE .MAT ERROR", err, err.stack);
      } else {
        var end_process = Date.now();
        //console.log("Read took " + (end_read - start_read) + "msec");
        //console.log("Preprocess took " + (end_preprocess - start_preprocess) + "msec");
        //console.log("Process took " + (end_process - start_process) + "msec");
      }
    }

    var end_read = Date.now();
    if (err) {
      //console.log("Error reading file " + filename + ": " + err);
    } else {
      //console.log("Data: " + data.length);
      var start_preprocess = Date.now();
      var block = "" + data;
      var lines = block.split("\n");
      var chunk_stream = [];
      var chunk = undefined;
      var pattern = /^# ([^:]+): (.+)$/;
      for(var index = 0; index < lines.length; index++) {
        var line = lines[index];
        var match = line.match(pattern);
        if (match) {
          switch (match[1]) {
            case "name":
              if(chunk) {
                chunk_stream.push(chunk);
              }
              chunk = {}
            default:
              chunk[match[1]] = match[2];
          }
        } else {
          if (chunk) {
            if (!chunk.hasOwnProperty("payload")) {
              chunk.payload = [line];
            } else {
              if (line) {
                chunk.payload.push(line);
              }
            }
          }
        }
      }
      chunk_stream.push(chunk);
      //console.log("Found " + chunk_stream.length + " chunks.");
      //console.log(chunk_stream);
      var end_preprocess = Date.now();
      var start_process = Date.now();
      while(chunk_stream.length > 0) {
        var results = chunk_stream_reader(chunk_stream);
        var name = results[0];
        var item = results[1];

        if (name == 'a') {
          finish(item, null);
        }
      }

    }
  });
}

