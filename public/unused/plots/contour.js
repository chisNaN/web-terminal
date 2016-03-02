RegisterPlotHandler('contour', function(message, plot_state) {
  var X = parse_mat(message.X);
  var Y = parse_mat(message.Y);
  var Z = parse_mat(message.Z);
  var V = parse_vec(message.V);
  var C = parse_mat(message.C);
  var options = plot_state.options;
  // update series/options based on the message

  n = Z.length;
  m = Z[0].length;

  // map v back onto interval [0, 1], where 0 corresponds to v1 and 1 corresponds to v2
  function reverse_interp(v1, v2, v) {
    // Value is not between the endpoints
    if (((v1 < v) && (v2 < v)) || ((v1 > v) && (v2 > v))) {return null;}
    // Both endpoints are equal to v.  Only need to return 0, since the other point will get covered by the next reverse_interp
    if (v1 == v2) { return 0;}
    // It is in-between
    return (v - v1) / (v2 - v1);
  }

  // t is in the interval [0, 1]
  function interp(v1, v2, t) {
    return (v2 - v1) * t + v1;
  }

  function add_iso_point(iso_points, x1, x2, y1, y2, z1, z2, v) {
    var t = reverse_interp(z1, z2, v);
    if (t !== null) {
      var x = interp(x1, x2, t);
      var y = interp(y1, y2, t);
      iso_points.push([x, y]);
    }
  }

  for (var vi in V) {
    var c = C[vi];
    var rgbc = "rgb(" + c[0] + "," + c[1] + "," +  c[2] + ")";
    var new_series = { 
      color: rgbc,
      data: []
    };
    var v = V[vi];
    for (var i = 1; i < n; i++) {
      for (var j = 1; j < m; j++) {
        var z1 = Z[i  ][j  ];
        var z2 = Z[i-1][j  ];
        var z3 = Z[i-1][j-1];
        var z4 = Z[i  ][j-1];

        var x1 = X[i  ][j  ];
        var x2 = X[i-1][j  ];
        var x3 = X[i-1][j-1];
        var x4 = X[i  ][j-1];

        var y1 = Y[i  ][j  ];
        var y2 = Y[i-1][j  ];
        var y3 = Y[i-1][j-1];
        var y4 = Y[i  ][j-1];

        var iso_points = [];
        add_iso_point(iso_points, x1, x2, y1, y2, z1, z2, v);
        add_iso_point(iso_points, x2, x3, y2, y3, z2, z3, v);
        add_iso_point(iso_points, x3, x4, y3, y4, z3, z4, v);
        add_iso_point(iso_points, x4, x1, y4, y1, z4, z1, v);

        if (iso_points.length == 0) {continue;}
        if (iso_points.length == 1) {console.log("SOMETHING WENT WRONG.  EXACTLY ONE ISO_POINT?");}
        if (iso_points.length > 2) {iso_points.push(iso_points[0]);} // make it circular
        for (var k = 0; k < iso_points.length; k++) {
          new_series.data.push(iso_points[k]);
          // TODO: include the color
        }
        new_series.data.push(null);
      }
    }
    plot_state.series.push(new_series);
  }

  //     var nums = message.series;
  //     // produce data lines
  //     for(var i=0; i<nums.length; i+=3){
  //       var x = nums[i];
  //       var y = nums[i+1];

  //       // parse style and update properties
  //       var style = nums[i+2];
  //       var lines = {};
  //       var points = {};
  //       var linecolor = null;
  //       if(style) {
  //         var line_style = style[0];
  //         var color = style[1];
  //         var marker_symbol = style[2];
  //         if(marker_symbol) {
  //           if( marker_symbol in symbolToHandler)  {
  //             marker_symbol=symbolToHandler[marker_symbol];
  //           }
  //           points = { symbol: marker_symbol, show:true, fill:false };
  //           if(points.symbol=="."){
  //             points.symbol = "circle";
  //             points.fill = 1.0;
  //             points.fillColor = null;
  //             points.radius=2;
  //           } else if (points.symbol == "o") {
  //             points.symbol = "circle";
  //             points.fill = 0;
  //             points.fillColor = null;
  //             points.radius=2;
  //           }
  //         }
  //         if(line_style){
  //           lines = {};
  //           if(line_style=="none") {
  //             lines.show = false;
  //           }
  //         }
  //         if(color in colorToString) {
  //           linecolor = colorToString[color];
  //           lines.fillColor = linecolor;
  //           points.fillColor = linecolor;
  //         }
  //       }
  //       var MakeSeries = function(data) {
  //         var temp = { data: data ,
  //                      images: {show:false}
  //                    };
  //         if(lines) temp.lines = lines;
  //         if(points) temp.points = points;
  //         if(linecolor) temp.color = linecolor;
  //         return temp;
  //       }

  //       if(y==null) {
  //         // deal with x = matrix
  //         if(is_vector(x)) {
  //           var data = [];
  //           for( var j=0; j<x.data.length; ++j){
  //             data.push([j+1, x.data[j]]);
  //           }
  //           series.push(MakeSeries(data));
  //         } else {
  //           // push one line per column
  //           var k = 0;
  //           for( var c=0; c<x.cols; ++c){
  //             var data = [];
  //             for( var r=0; r<x.rows; ++r){
  //               data.push([r+1,x.data[k]]);
  //               ++k;
  //             }
  //             series.push(MakeSeries(data));
  //           }
  //         }
  //       } else if (is_vector(x) && is_vector(y)) {
  //         var data = zip(x.data,y.data);
  //         series.push(MakeSeries(data));
  //       } else if( is_vector(x) && !is_vector(y)) {
  //         var before = series.length;
  //         push_lines_vec_mat(x,y,series,false, MakeSeries);
  //       } else if( !is_vector(x) && is_vector(y)) {
  //         // opposite of previous case
  //         var before = series.length;
  //         push_lines_vec_mat(y,x,series,true, MakeSeries);
  //         //for(var k=before; k<series.length; ++k) {
  //         //  styles.push(style);
  //         //}
  //       } else {
  //         // matrix vs matrix, easy
  //         for(var j=0; j<x.cols; ++j){
  //           var s = j*x.rows;
  //           var data = [];
  //           for(var k=0; k<x.rows; ++k){
  //             data.push( [ x.data[s+k], y.data[s+k] ] );
  //           }
  //           series.push(MakeSeries(data));
  //           //styles.push(style);
  //         }
  //       }
  //     }
})
