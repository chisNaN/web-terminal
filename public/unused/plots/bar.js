RegisterPlotHandler('bars', function(message, plot_state) {
  var bars = message.data;
  var mat = parse_mat(bars);
  // decrease width to minimum so bars do not touch
  
  var temp = {
    shadowSize: 0, 
    data: [],
    bars: {show: true, lineWidth: 1, barWidth: bars.barWidth, align: 'center' },
    lines: {show:false} ,
    images: {show:false} 
  }
  for(var i=0; i<mat.length; ++i) {
    temp.data.push([mat[i][0], mat[i][1]]);
    if(i>0){
      var mind = .8*(mat[i][0] - mat[i-1][0]);
      if(temp.bars.barWidth > mind) {
        temp.bars.barWidth = mind;
      }
    }
  }
  plot_state.series.push(temp);
})
