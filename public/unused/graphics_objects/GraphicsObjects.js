(function(exports, is_client) {

// TODO: do this better?
if (!is_client) { 
  FactoryDefaults = require('./FactoryDefaults.json');
}

// TODO: how to organize this file?

var ROOT_TYPE = 'root';
var FIGURE_TYPE = 'figure';
var AXES_TYPE = 'axes';
var LINE_TYPE = 'line';
var PATCH_TYPE = 'patch';
//               'uimenu'
//            'uitoolbar'
//                 'text'
//              'surface'
//            'rectangle'
//                'light'
//                'image'
//              'hggroup'
//           'uipushtool'
//         'uitoggletool'
//    'uitogglesplittool'

TreeNodeTypes = {};

function initialize_types() { // to be called after all the constructors
  TreeNodeTypes[ROOT_TYPE] = RootNode;
  TreeNodeTypes[FIGURE_TYPE] = FigureNode;
  TreeNodeTypes[AXES_TYPE] = AxesNode;
  TreeNodeTypes[LINE_TYPE] = LineNode;
  TreeNodeTypes[PATCH_TYPE] = PatchNode;
  
  for (var type in TreeNodeTypes) {
    TreeNodeTypes[type].prototype.type = type;
  }

  for (var type in TreeNodeTypes) {
    TreeNodeTypes[type].prototype.defaults = {};
  }
}

var normalize_map = {
  'currentfigure': 'CurrentFigure'
}
function normalize_property(prop) {
  // TODO : deal with case of factory and default
  if (prop.toLowerCase() in normalize_map) {
    return normalize_map[prop.toLowerCase()];
  } else {
    return prop;
  }
}

///////////////////////////////////////////////////////////////////////////////
// UTILITIES
///////////////////////////////////////////////////////////////////////////////

function getNewCounter() {
  return function() {
    var x = 0;
    return function() {
      return x++;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
// TREENODE
///////////////////////////////////////////////////////////////////////////////

// NOTE: Only parent and children may contain references to other objects!
function TreeNode( handle, parent, props ) {
  this.handle = handle;
  this.parent = parent;
  if (this.parent) {
    this.parent.children[handle] = this;
    this.parent.properties.Children.push(handle);
    this.handle_map = this.parent.handle_map;
  } else {
    this.handle_map = {};
  }
  this.handle_map[handle] = this;

  this.properties = this.getDefaultProperties();
  this.properties.Children = [];
  this.properties.HandleVisibility = 'on';
  this.properties.Type = this.type;
  this.Set(props);

  this.children = {};
  return this;
}

// TODO: change the way this works entirely.  
TreeNode.prototype.getDefaultProperties = function() {
  return {};
}

// reset(h) resets all properties having factory defaults on the object identified by h. To see the list of factory defaults, use the statement
// If h is a figure, the MATLAB® software does not reset Position, Units, WindowStyle, or PaperUnits. If h is an axes, MATLAB does not reset Position and Units.
TreeNode.prototype.Reset = function() {
  var new_properties = this.getDefaultProperties();
  if (this.type == FIGURE_TYPE) {
    new_properties.Position = this.properties.Position;
    new_properties.Units = this.properties.Units;
    new_properties.WindowStyle = this.properties.WindowStyle;
    new_properties.PaperUnits = this.properties.PaperUnits;
  } else if (this.type == AXES_TYPE) {
    new_properties.Position = this.properties.Position;
    new_properties.Units = this.properties.Units;
  }
  this.properties = new_properties;
}

TreeNode.prototype.Delete = function() {
  if (!this.parent) {
    console.log('Root object may not be deleted!');
    return;
  }
  for (var h in this.children) {
    var child = this.children[h];
    child.Delete();
  }
  var handle = this.handle;
  delete this.handle_map[handle];

  delete this.parent.children[handle];
  var index = this.parent.properties.Children.indexOf(handle);
  this.parent.properties.Children.splice(index, 1);
}

// Takes a dictionary of properties and merges it into its own properties dictionary
TreeNode.prototype.Set = function(props) {
  for (var prop in props) {
    this.properties[prop] = props[prop];
  }
}

// Gets a given property of the node
TreeNode.prototype.Get = function(prop) {
  return this.properties[prop] || null;
}

TreeNode.prototype.Serialize = function() {
  var serialized = {};
  for (var i in this) {
    if (i == 'parent' || i == 'children' || i == 'handle_map') {continue;}
    if (this.hasOwnProperty(i)) {
      if (typeof this[i] !== "function") {
        serialized[i] = this[i];
      }
    }
  }
  serialized.serialized_children = {};
  for(var i in this.children) {
    serialized.serialized_children[i] = this.children[i].Serialize();
  }
  return serialized;
}

TreeNode.prototype.Deserialize = function(serialized) {
  for (var i in serialized) {
    if (i == 'parent_handle' || i == 'children_handles') {continue;}
    if (serialized.hasOwnProperty(i)) {
      this[i] = serialized[i];
    }
  }

  var children_handles = serialized.serialized_children;
  for (var h in serialized.serialized_children) {
    var serialized_child = serialized.serialized_children[h];
    // TODO: constructor based on the type
    //var node = new TreeNode(h, this, {}); 
    var node = new TreeNodeTypes[serialized_child.type](h, this, {});
    node.Deserialized(serialized_child);
  }
  return this;

}

TreeNode.prototype.UpdateLimits = function() {
  if (this.properties.XData) {this.xmin = Math.min.apply({}, this.properties.XData);}
  if (this.properties.XData) {this.xmax = Math.max.apply({}, this.properties.XData);}
  if (this.properties.YData) {this.ymin = Math.min.apply({}, this.properties.YData);}
  if (this.properties.YData) {this.ymax = Math.max.apply({}, this.properties.YData);}
  if (this.properties.ZData) {this.zmin = Math.min.apply({}, this.properties.ZData);}
  if (this.properties.ZData) {this.zmax = Math.max.apply({}, this.properties.ZData);}
  if (this.parent.xmin !== undefined) {this.parent.xmin = Math.min(this.xmin, this.parent.xmin);}
  if (this.parent.xmax !== undefined) {this.parent.xmax = Math.max(this.xmax, this.parent.xmax);}
  if (this.parent.ymin !== undefined) {this.parent.ymin = Math.min(this.ymin, this.parent.ymin);}
  if (this.parent.ymax !== undefined) {this.parent.ymax = Math.max(this.ymax, this.parent.ymax);}
  if (this.parent.zmin !== undefined) {this.parent.zmin = Math.min(this.zmin, this.parent.zmin);}
  if (this.parent.zmax !== undefined) {this.parent.zmax = Math.max(this.zmax, this.parent.zmax);}
}

exports.TreeNode = TreeNode;

///////////////////////////
// GRAPHICS OBJECT MUTATORS
///////////////////////////

// reset
// set
// get
// __get__
// __go_figure__
// __calc_dimensions__
// __go_axes__
// __go_line__
// __go_text__
// __go_image__
// __go_surface__
// __go_patch__
// __go_hggroup__
// __go_delete__
// __go_axes_init__
// __go_handles__
// __go_figure_handles__
// __image_pixel_size__
// drawnow
// addproperty
// waitfor
// addlistener
// dellistener
// available_graphics_toolkits
// register_graphics_toolkit
// loaded_graphics_toolkits
// __go_execute_callback__
// __go_uimenu__
// __go_uicontrol__
// __go_uipanel__
// __go_uicontextmenu__
// __go_uitoolbar__
// __go_uipushtool__
// __go_uitoggletool__

// each handler receives a rootnode, message, and callback
MessageHandlers = {
  'get_all': function(root, msg, cb) {
    var handle = msg.handle;
    var result = {};

    var node = root.handle_map[handle];
    if (!node) {return cb({error: 'Invalid handle: ' + handle});}

    if (handle === 0) {
      // TODO: get all user-settable properties
      result = node.properties;
    } else {
      result = node.properties;
    }

    cb({error: null, result: result});
  },

  'get': function(root, msg, cb) {
    var handles = ensure_array(msg.handles);
    var properties = ensure_array(msg.properties);
    var result = [];
   
    for (var i =0; i< handles.length; i++) {
      var handle = handles[i];
      var node = root.handle_map[handle];
      if (!node) {return cb({error: 'Invalid handle: ' + handle});}
      var row = [];
      for (var j =0; j< properties.length; j++) {
        var property = normalize_property(properties[i]);
        if (property.slice(0, 7) == 'factory') {
          // TODO
          return cb({error: 'Getting factory properties currently not supported'});
        } else if (property.slice(0, 7) == 'default') {
          // TODO
          return cb({error: 'Getting default properties currently not supported'});
        } else {
          // TODO:
          if (property in node.properties) {
            row.push(node.properties[property]);
          } else {  
            return cb({error: 'Property ' + property + ' not accessible for handle ' + handle});
          }
        }
      }
      result.push(row);
    }
    cb({error: null, result: result});
  },

  // used for __is_handle_visible__
  'is_handle_visible': function(root, msg, cb) {
    var handle = msg.handle;
    if (handle in root.handle_map) {
      var visibility = root.handle_map[handle].properties.HandleVisibility;
      if (visibility == 'on') {
        return cb({error: null, result: 1});
      } else if (visibility == 'off') {
        return cb({error: null, result: 0});
      } else {
        return cb({error: 'Can\'t do visibility of ' + handle + ': ' + visibility});
      }
    } else {
      return cb({error: null, result: 0});
    }
  },

  'ishandle': function(root, msg, cb) {
    var handles = ensure_array(msg.handles);
    var result = [];
    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];
      if (handle in root.handle_map) {
        result.push(1);
      } else {
        result.push(0);
      }
    }
    cb({error: null, result: result});
  },

  '__go_figure__': function(root, msg, cb) {
    var id = msg.figure_id;
    console.log(id);
    console.log(isNaN(id));
    console.log(typeof id);
    console.log(id == 'NaN');
    if (id && id in root.children) {
      return cb({error: 'Figure id ' + id + ' is already taken'});
    }
    var id = root.NewFigure(id);
    cb({error: null, result: id});
  }
}
exports.MessageHandlers = MessageHandlers;

function ensure_array(arr) {
  return (Object.prototype.toString.call(arr) === '[object Array]' ) ? arr : [arr];
}

/////////////////////////
// GRAPHICS OBJECTS
/////////////////////////

// http://www.mathworks.com/help/matlab/core-objects-1.html
// Also:
// http://www.mathworks.com/help/matlab/graphics-objects.html
// http://www.mathworks.com/help/matlab/creating_plots/accessing-object-handles.html#f7-18932

// primitives?  hmm, doesnt have patch
// http://www.mathworks.com/help/symbolic/mupad_ug/primitives.html


// http://www.mathworks.com/help/matlab/ref/rootobject_props.html
RootNode.prototype = new TreeNode(); // Inherit from TreeNode 

function RootNode() {
  TreeNode.call(this, 0, null, {});
}

RootNode.prototype.getDefaultProperties = function() {
  return {
    CurrentFigure: null,
  };
}

RootNode.prototype.constructor = RootNode;

RootNode.prototype.GetNextFigureID = function() {
  var id = 1;
  while (id in this.children) {
    id ++;
  }
  return id;
}

RootNode.prototype.HandleMessage = function(msg, cb) {
  var type = msg.type;
  if (type in exports.MessageHandlers) {
    try {
      exports.MessageHandlers[type](this, msg, cb);
    } catch (e) {
      cb({error: 'Exception: \n' + e + '\n' + e.stack});
    }
  } else {
    cb({error: 'Unable to handle message of type: ' + type});
  }
}

RootNode.prototype.NewFigure = function(id) {
  id = id || this.GetNextFigureID();

  var figurenode = new FigureNode(this, id);
  this.properties.CurrentFigure = id;
  return id;
}

RootNode.prototype.CloseFigure = function(id) {
  if (id == 'all') {
    for (id  in this.children) {
      this.CloseFigure(id);
    }
    return;
  }

  var figurenode = this.children[id];
  figurenode.Delete();

  var cur_figure = this.properties.CurrentFigure;
  if (id == cur_figure) {
      cur_figure = null;
      for(var k in this.children) {
        cur_figure = k;
        if (k > id) {
          break;
        }
      }
    }
  this.properties.CurrentFigure = cur_figure;
  return id;
}

RootNode.prototype.GetCurrentFigure = function() {
  return this.children[this.properties.CurrentFigure];
}

RootNode.prototype.GetCurrentAxes = function() {
  return this.GetCurrentFigure().GetCurrentAxes();
}

RootNode.prototype.Line = function(x, y, z, properties) {
  return this.GetCurrentFigure().Line(x, y, z, properties);
}

RootNode.prototype.Patch = function(x, y, z, color, properties) {
  return this.GetCurrentFigure().Patch(x, y, z, color, properties);
}

RootNode.prototype.Subplot = function(m, n, p) {
  return this.GetCurrentFigure().Subplot(m, n, p);
}

exports.RootNode = RootNode;

// http://www.mathworks.com/help/matlab/ref/figure_props.html
FigureNode.prototype = new TreeNode(); // Inherit from TreeNode 

function FigureNode(parent, id) {
  this.id = id;
  this.subplots = {};
  TreeNode.call(this, id, parent, {});
}
FigureNode.prototype.constructor = FigureNode;

FigureNode.prototype.getDefaultProperties = function() {
  return {
    CurrentAxes: null
  };
}

FigureNode.prototype.NewAxes = function(props) {
  var axesnode = new AxesNode(this, props);
  this.properties.CurrentAxes = axesnode.handle;
  this.children[axesnode.handle] = axesnode;
  // TODO: delete overlapping axes?  (verify this is what matlab does)
  return axesnode;
}

FigureNode.prototype.GetCurrentAxes = function() {
  if (this.properties.CurrentAxes === null) {
    var node = this.Subplot();
  }
  return this.children[this.properties.CurrentAxes];
}

FigureNode.prototype.Subplot = function(m, n, p) {
  m = (m || 1);
  n = (n || 1);
  p = (p || 1);
  var mnp = [m,n,p].join(',');

  if (this.subplots[mnp]) {
    return this.subplots[mnp];
  }

  var col = (p-1) % n;
  var row = Math.floor((p-1) / n);
  var left = col / n;
  var top = row / m;
  var width = 1 / n; 
  var height = 1 / m;
  var bottom = 1 - top - width;
  var position = [left, bottom, width, height];

  var axesnode = this.NewAxes({'Position': position});
  this.subplots[mnp] = axesnode;

  return axesnode;
}

FigureNode.prototype.Line = function(x, y, z, properties) {
  return this.GetCurrentAxes().Line(x, y, z, properties);
}

FigureNode.prototype.Patch = function(x, y, z, color, properties) {
  return this.GetCurrentAxes().Patch(x, y, z, color, properties);
}

exports.FigureNode = FigureNode;

// http://www.mathworks.com/help/matlab/ref/axes.html
// http://www.mathworks.com/help/matlab/ref/axes_props.html
AxesNode.prototype = new TreeNode(); // Inherit from TreeNode 

function AxesNode(parent, props) {
  var handle = this.type + '.' + this.GetNextId();
  TreeNode.call(this, handle, parent, props);
  this.xmin = Infinity;
  this.xmax = -Infinity;
  this.ymin = Infinity;
  this.ymax = -Infinity;
  this.zmin = Infinity;
  this.zmax = -Infinity;
}
AxesNode.prototype.constructor = AxesNode;

AxesNode.prototype.getDefaultProperties = function() {
  return {
      GridLineStyle: ':'
    , XLim: null
    , YLim: null
    , XLimMode: 'auto'
    , YLimMode: 'auto'
    // , OuterPosition: position // what's the difference?
    , Position: [0, 0, 1, 1]
  };
}


var AxesNodeIDCounter = getNewCounter();
AxesNode.prototype.GetNextId = AxesNodeIDCounter();

AxesNode.prototype.Line = function(x, y, z, properties) {
  var node = new LineNode(this, x, y, z, properties);
}

AxesNode.prototype.Patch = function(x, y, z, color, properties) {
  var node = new PatchNode(this, x, y, z, color, properties);
}

exports.AxesNode = AxesNode;


// http://www.mathworks.com/help/matlab/ref/line.html
// http://www.mathworks.com/help/matlab/ref/line_props.html
LineNode.prototype = new TreeNode(); // Inherit from TreeNode 

function LineNode(parent, x, y, z, props) {
  var handle = this.type + '.' + this.GetNextId();

  TreeNode.call(this, handle, parent, props);
  if (x) {this.properties.XData = x;}
  if (y) {this.properties.YData = y;}
  if (z) {this.properties.ZData = z;}
  this.num_dims = z ? 3 : 2;
  this.UpdateLimits();

}
LineNode.prototype.constructor = LineNode;

LineNode.prototype.getDefaultProperties = function() {
  return {
      XData : [0, 1]
    , YData : [0, 1]
    , ZData : []
    , Color :  [0, 0, 0] // TODO: cycle this
    , LineWidth : 0.5 
    , LineStyle :  '-'
  };
}

var LineNodeIDCounter = getNewCounter();
LineNode.prototype.GetNextId = LineNodeIDCounter();

exports.LineNode = LineNode;

// http://www.mathworks.com/help/matlab/ref/line.html
// http://www.mathworks.com/help/matlab/ref/line_props.html
PatchNode.prototype = new TreeNode(); // Inherit from TreeNode 

function PatchNode(parent, x, y, z, color, props) {
  var handle = this.type + '.' + this.GetNextId();

  TreeNode.call(this, handle, parent, props);
  if (x) {this.properties.XData = x;}
  if (y) {this.properties.YData = y;}
  if (z) {this.properties.ZData = z;}
  if (color) {this.properties.CData = color;}
  this.num_dims = z ? 3 : 2;
  this.UpdateLimits();
}
PatchNode.prototype.constructor = PatchNode;

PatchNode.prototype.getDefaultProperties = function() {
  return {
      XData : []  // are these correct?
    , YData : [] 
    , ZData : []
    , CData : [0, 0, 0]
    , EdgeColor : [0, 0, 0]
    , LineWidth : 0.5 
    , LineStyle :  '-'
  };
}

var PatchNodeIDCounter = getNewCounter();
PatchNode.prototype.GetNextId = PatchNodeIDCounter();

exports.PatchNode = PatchNode;

initialize_types();

})(typeof exports === "undefined" ? (window.GraphicsObjects={}, window.GraphicsObjects) : module.exports);
