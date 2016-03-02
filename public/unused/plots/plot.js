RegisterPlotHandler('plot', function(message, plot_state) {
  var series = plot_state.series;
  var options = plot_state.options;
  // update series/options based on the message

  if (message.properties.logx == "true") {
    var xtransform = function(v) {return Math.log(v);};
  } else {
    var xtransform = function(v) {return v;};
  }

  if (message.properties.logy == "true") {
    var ytransform = function(v) {return Math.log(v);};
  } else {
    var ytransform = function(v) {return v;};
  }

  options.xaxis.transform = xtransform;
  options.yaxis.transform = ytransform;

  var nums = message.series;
  // produce data lines
  for(var i=0; i<nums.length; i+=3){
    var x = nums[i];
    var y = nums[i+1];

    // parse style and update properties
    var style = nums[i+2];
    var lines = {};
    var points = {};
    var linecolor = null;
    if(style) {
      var line_style = style[0];
      var color = style[1];
      var marker_symbol = style[2];
      if(marker_symbol) {
        if( marker_symbol in symbolToHandler)  {
          marker_symbol=symbolToHandler[marker_symbol];
        }
        points = { symbol: marker_symbol, show:true, fill:false };
        if(points.symbol=="."){
          points.symbol = "circle";
          points.fill = 1.0;
          points.fillColor = null;
          points.radius=2;
        } else if (points.symbol == "o") {
          points.symbol = "circle";
          points.fill = 0;
          points.fillColor = null;
          points.radius=2;
        }
      }
      if(line_style){
        lines = {};
        if(line_style=="none") {
          lines.show = false;
        }
      }
      if(color in colorToString) {
        linecolor = colorToString[color];
        lines.fillColor = linecolor;
        points.fillColor = linecolor;
      }
    }
    var MakeSeries = function(data) {
      var temp = { data: data ,
                   images: {show:false}
                 };
      if(lines) temp.lines = lines;
      if(points) temp.points = points;
      if(linecolor) temp.color = linecolor;
      return temp;
    }

    if(y==null) {
      // deal with x = matrix
      if(is_vector(x)) {
        var data = [];
        for( var j=0; j<x.data.length; ++j){
          data.push([j+1, x.data[j]]);
        }
        series.push(MakeSeries(data));
      } else {
        // push one line per column
        var k = 0;
        for( var c=0; c<x.cols; ++c){
          var data = [];
          for( var r=0; r<x.rows; ++r){
            data.push([r+1,x.data[k]]);
            ++k;
          }
          series.push(MakeSeries(data));
        }
      }
    } else if (is_vector(x) && is_vector(y)) {
      var data = zip(x.data,y.data);
      series.push(MakeSeries(data));
    } else if( is_vector(x) && !is_vector(y)) {
      var before = series.length;
      push_lines_vec_mat(x,y,series,false, MakeSeries);
    } else if( !is_vector(x) && is_vector(y)) {
      // opposite of previous case
      var before = series.length;
      push_lines_vec_mat(y,x,series,true, MakeSeries);
      //for(var k=before; k<series.length; ++k) {
      //  styles.push(style);
      //}
    } else {
      // matrix vs matrix, easy
      for(var j=0; j<x.cols; ++j){
        var s = j*x.rows;
        var data = [];
        for(var k=0; k<x.rows; ++k){
          data.push( [ x.data[s+k], y.data[s+k] ] );
        }
        series.push(MakeSeries(data));
        //styles.push(style);
      }
    }
  }
})
