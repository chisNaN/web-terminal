"use strict";

var use_dynamodb = false;

var MonotonicBigPlot = function(plot_id, self_options, placeholder, series, options)  {
  if (!use_dynamodb) {
    this.plot_url = plot_id;
  }

  this.url_json_cache = {};
  this.waiting = {};
  // list of level, slice pairs
  this.files_done = false;
  this.options = self_options;
  
  this.info = null;

  this.my_series = {data: [null],
                    options: self_options}

  this.new_slices = false;
  this.xmin = null;
  this.xmax = null;

  series.push(this.my_series);

  this.getManyJSON = function(slices) {
    var results = {};
    var count = 0;
    // calls cb with a dictionary mapping slices to all objects when they're all done

    if (use_dynamodb) {
      for(var i=0; i<slices.length; ++i){
        var slice = slices[i];
        if (! this.waiting[slice]) {
          this.waiting[slice] = true;
          $.get('/get_bigplot_slice', {id: plot_id, hash_key: slice}, function(data) {
            var slice = this.url.split('hash_key').slice(-1)[0].slice(1);
            count++;
            this.waiting[slice] = false;
            if (data) {
              this.new_slices = true;
              var slice_data = JSON.parse(data);
              slice_data.xs = JSON.parse(slice_data.xs);
              slice_data.ys = JSON.parse(slice_data.ys);
              results[slice] = slice_data;
            } else {
              results[slice] = null;
            }
            if (count==slices.length) {this.cache_new_results(results);} 
          });
        } else { 
          count ++; // not waiting for that one;
        }
      }
      if (!files_done) {
        $.get('/get_bigplot_slice', {id: plot_id, hash_key: 'done'}, function(data) {
          if (data) {this.files_done = true;}
        });
      }
    } else {

      var success = function(that) {
        return function(result) {
          that.new_slices = true;
          result.xs = result.xs;
          result.ys = result.ys;
          results[this]=result;
          that.waiting[this]=false;
          count++;
          if (count==slices.length) {that.cache_new_results(results);} 
        };
      } (this);

      var error = function(that) {
        return function(jqXHR, textStatus, error){
          results[this]=null;
          that.waiting[this]=false;
          count++;
          if (count==slices.length) {that.cache_new_results(results);} 
        };
      } (this);
      
      for(var i=0; i<slices.length; ++i){
        var url = slices[i];
        if (! this.waiting[url]) {
          this.waiting[url] = true;
          $.ajax({
            url: url,
            dataType: 'json',
            context: url,
            success: success,
            error: error
          });
        }
      }
      if (!this.files_done) {
        var success = function(that) {
          return function(result) {
            that.files_done = true;
          };
        } (this);

        $.ajax({
          url: this.plot_url + encodeURIComponent("/done"),
          success: success
        });
      }
    }
  }
  
  this.update_plot = function() {
    if (!this.info) return;

    var slices = this.get_slices();
    
    var missing_slices = [];
    var points = [];

    var lowest = null;
    var highest = null;

    var lower = null;
    var higher = null;

    for(var i=0; i<slices.length; ++i) {
      var ls = slices[i];
      var l = ls[0], s = ls[1];
      if (use_dynamodb) {
        var name = l + "_" + s;
      } else {
        var name = this.plot_url + encodeURIComponent("/slice_" + l + "_" + s + ".js");
      }
  
      if(name in this.url_json_cache) {
        var slice_obj = this.url_json_cache[name];
        if(slice_obj) {
          for( var j=0; j<slice_obj.num_points; ++j){
            var x = slice_obj.xs[j];
            var y = slice_obj.ys[j];
            points.push([x, y]);
            if ((this.xmin <= x) && (x<= this.xmax)) {
              if (lowest == null || lowest > y) {lowest = y;}
              if (highest == null || highest < y) {highest = y;}
            }
            //if ((this.xmin <= x) && (x<= this.xmax)) {
            //  points.push([x, y]);
            //} else if (x < this.xmin) {
            //  if ((lower == null) || (x > lower[0])) {lower = [x, y];}
            //} else { // x > this.xmax 
            //  if ((higher == null) || (x < higher[0])) {higher = [x, y];}
            //}
          }
        } else if (!this.files_done) {
          missing_slices.push(name);
        }
      } else {
        missing_slices.push(name);
      }
    }
    if (lower !== null) {points.push(lower);}
    if (higher !== null) {points.push(higher);}
  
    points.sort( function(x,y) { return x[0]-y[0]; } );

    // console.log('NUM SLICES:' + slices.length);
    // console.log('NUM POINTS:' + points.length);
    // add points to data
    this.my_series.data = points;

    // this optimization can cause slightly bad behavior.  
    // e.g. randn(1,100000)
    // zooming in, then zooming out, will show much more stuff in the zoomed in region
    // if (this.new_slices) {
      try {
        if (this.options.y_adjust) {
          options.yaxis.min = lowest;
          options.yaxis.max = highest;
        }
        $.plot(placeholder, series, options);
      } catch (e) { 
        // Uncaught TypeError: Cannot call method 'shutdown' of undefined jquery.flot.js:881
        console.log(e);
      }
      this.new_slices = false;
    // }

    // pull more data and replot
    if (missing_slices.length > 0) {

      var callback = function (that, missing_slices) {
        return function() {
          that.getManyJSON(missing_slices);
        };
      } (this, missing_slices);

      if (this.files_done) {
        callback()
      } else {
        setTimeout(callback, 1000);
      }
    }
  }

  this.cache_new_results = function(results, good) {
    for(var k in results) { this.url_json_cache[k] = results[k]; }
    this.update_plot();
  };
  
  this.get_slices = function() {
    var tot_xmin = this.info.xmin;
    var tot_xmax = this.info.xmax;
  
    if (options.xaxis.min != null) {
      this.xmin = options.xaxis.min;
    } else {
      this.xmin = this.info.xmin;
    }

    if (options.xaxis.max != null) {
      this.xmax = options.xaxis.max;
    } else {
      this.xmax = this.info.xmax;
    }

    var branch_factor = 8; // HARDCODED TO MATCH SERVER

    var level = Math.max(0, Math.ceil(Math.log((tot_xmax - tot_xmin) / (this.xmax - this.xmin)) / Math.log(branch_factor)));

    var slices = [  ];
    for (var i = 0; i <= level; ++i) {

      var slice_width = (tot_xmax - tot_xmin) / (Math.pow(branch_factor, i));
      var start_index = Math.max(0, 
                                 Math.floor((this.xmin - tot_xmin) / slice_width) - 1);
      var end_index = Math.min(Math.pow(branch_factor, i) - 1, 
                               Math.ceil((this.xmax - tot_xmin) / slice_width) + 1);
      // console.log(i, start_index, end_index)

      for(var j=start_index; j<=end_index; ++j) {
        slices.push([i,j]);
      }
    }
    //console.log('NUM LEVELS:' , (level + 1));
    return slices;
  }

  this.update_from_axis_change = function(that) {
    return function(xmin, xmax, ymin, ymax) {
       options.xaxis.min = xmin;
       options.xaxis.max= xmax;
       options.yaxis.min = ymin;
       options.yaxis.max= ymax;
       that.update_plot()
    };
  } (this);

  var update_from_plot_event = function(that) {
    return function(event, plot) {
       var axes = plot.getAxes();
       options.xaxis.min = axes.xaxis.min;
       options.xaxis.max= axes.xaxis.max;
       options.yaxis.min = axes.yaxis.min;
       options.yaxis.max= axes.yaxis.max;
       that.update_plot()
    };
  } (this);

  placeholder.bind('dragend', update_from_plot_event);

  placeholder.bind('plotzoom', update_from_plot_event);
  
  this.try_to_initialize = function(that) {
    return function() {
      if (use_dynamodb) {
        $.get('/get_bigplot_slice', {id: plot_id, hash_key: 'index'}, function(data) {
          if (data) {
            that.new_slices = true;
            that.info = JSON.parse(data);
            that.update_plot();
            clearInterval(that.initial_interval_var);
          } 
        })
      } else {
        var url = that.plot_url + encodeURIComponent("/index.js");
        $.ajax({
          url: url,
          dataType: 'json',
          context: url,
          success: function(result) {
            that.new_slices = true;
            that.info = result;
            that.update_plot();
            clearInterval(that.initial_interval_var);
          },
        });
      }
    }
  } (this);
  this.initial_interval_var = setInterval(this.try_to_initialize, 1000);
  return this;
}
