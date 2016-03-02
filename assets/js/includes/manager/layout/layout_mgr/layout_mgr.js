LayoutMGR = (function($){
  // event -> list of functions
  var eventHandlers = {};

  function registerHandler(event_type, handler) {
    if (!eventHandlers[event_type]) {
      eventHandlers[event_type] = [];
    }
    eventHandlers[event_type].push(handler);
  }

  function AddSplitterEvents(layout, split_id, $el) {
    var $parent = $(layout.parentSel || 'body');
    var divs = layout.divs,
        split = layout.splits[split_id],
        split_div = divs[split_id];

    var f1=[], s1, f2=[], s2;

    if(split.axis=='x') {
      f1 = split.left;
      s1 = 'r';
      f2 = split.right;
      s2 = 'l'; // yes, it is the opposites
    } else {
      f1 = split.top;
      s1 = 'b';
      f2 = split.bottom;
      s2 = 't';
    }
    var css_props = { l:'left', r:'right', t:'top', b:'bottom' };
    function start(ev, ui) {
      //console.log('start');
      $('.panel').css('pointer-events','none');
      drag(ev,ui);
    }
    function stop(ev,ui) {
      //console.log('stop');
      drag(ev, ui, true);
      $('.panel').css('pointer-events','auto');
    }

    function drag(ev, ui, resize) {
      if (eventHandlers.drag) {
        for (var j = 0; i < eventHandlers.drag.length; j++) {
          eventHandlers.drag[j]();
        }
      }

      resize = true;
      var percent;
      if(split.axis=='x') {
        percent = (ui.position.left / $parent.width());
      } else {
        percent = (ui.position.top / $parent.height());
      }
      percent *= 100;
      split_div[s2] = percent + '%';
      // copy splitter into divs
      var i;

      for(i=0; i<f1.length; ++i) {
        var d1 = divs[f1[i]];
        var $d1 = $('#'+f1[i]);
        $d1.css(css_props[s1], d1[s1] = (100-percent)+'%');
        if(resize) {
          $d1.trigger('resize');
        }
      }
      for(i=0; i<f2.length; ++i) {
        var d2 = divs[f2[i]];
        var $d2 = $('#'+f2[i]);
        $d2.css(css_props[s2], d2[s2] = percent + '%');
        if(resize) {
          $d2.trigger('resize');
        }
      }
      $el.css(css_props[s2], percent + '%');
    }
    $el.draggable({axis:split.axis, start:start, stop:stop, drag:drag, iframeFix:false, containment:'window'});
  }

  $(window).resize(function(){
      //$('.panel').trigger('resize');
  });

  function Render(layout) {
    EnforceConstraints(layout);
    var d = layout.divs;
    // remove existing splitters
    $('.resize').remove();
    var di, $el;
    for (var k in d) {
      di = d[k];
      $el = $('#' + k);
      if (!layout.splits[k]) {
        $el.addClass('panel');
        $el.css({'left': di.l,
                 'right': di.r,
                 'top': di.t,
                 'bottom': di.b,
                 //'display', di.hide ? 'none' : 'block'
                });
      }
    }
    setTimeout(function() {
      for (var j in d) {
        $el = $('#' + j);
        $el.trigger('resize');
      }
    }, 500);

    for(var i in layout.splits) {
      di = d[i];
      $el = $('<div/>', {id:i}).appendTo($(layout.parentSel||'body'));
      $el.addClass('resize').addClass('resize_' + layout.splits[i].axis);
      AddSplitterEvents(layout, i, $el);
      $el.css({'left': di.l,
               'right': di.r,
               'top': di.t,
               'bottom': di.b,
               //'display', di.hide ? 'none' : 'block'
              });
    }
  }

  function EnforceConstraints(layout) {
     // in theory this would have be repeated till convergence?
    var splits = layout.splits;
    for(var i in splits){
      EnforceSplitter(layout.divs, splits[i], i);
    }
  }
  function EnforceSplitter(divs, split, split_id) {
    var f1=[],s1, f2=[],s2;
    if(split.axis=='x') {
      f1 = split.left;
      s1 = 'r';
      f2 = split.right;
      s2 = 'l'; // yes, it is the opposites
    } else {
      f1 = split.top;
      s1 = 'b';
      f2 = split.bottom;
      s2 = 't';
    }
    // copy splitter into divs
    var i;
    for(i=0; i<f1.length; ++i) {
      var d1 = divs[f1[i]];
      //console.log(f1[i]);
      d1[s1] = (100-parseFloat(divs[split_id][s2]))+'%';
    }
    for(i=0; i<f2.length; ++i) {
      var d2 = divs[f2[i]];
      //console.log(f2[i]);
      d2[s2] = parseFloat(divs[split_id][s2]) + '%';
    }
  }

  return {
    Render: Render,
    EnforceSplitters: EnforceConstraints,
    on: registerHandler
  };
})(jQuery);
