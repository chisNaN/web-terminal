// NOTE: Only parent and children may contain references to other objects!
function TreeNode( parent, properties ) {
  this.parent = parent;
  if (this.parent) {this.parent.children.push(this);}

  this.properties = properties;
  this.children = [];
  this.type = (this.type || null);
  return this;
}

/////////////////////////////////////////
// Stores the graph of handles
/////////////////////////////////////////

function HandleTree() {
  this.handles = {};
}

HandleTree.prototype.AddNode = function(node, h) {
  var id = Date.now(); // TODO: change
  h = h || ((node.properties.type || "unknown") +  "@" + id);
  node.handle = h;
  this.handles[h] = node;
  return h;
};

HandleTree.prototype.Serialize = function() {
  var serialized = {};
  for(var h in this.handles ){
    var node = this.handles[h];
    serialized_node = {};
    for (var i in node) {
      if (i == 'parent' || i == 'children') {continue;}
      if (node.hasOwnProperty(i)) {
        serialized_node[i] = node[i];
      }
    }
    serialized_node.parent_handle = (node.parent ? node.parent.handle : null);
    serialized_node.children_handles = [];
    for(var i in node.children) {
      serialized_node.children_handles.push(i);
    }   

    serialized[h] = serialized_node;
  }
  return serialized;
};

function DeserializeHandleTree(serialized_tree) {
  var handleTree = new HandleTree();

  // create the nodes
  for (var h in serialized_tree) {
    var serialized_node = serialized_tree[h];
    var node = new TreeNode(null, serialized_node.properties);
    for (var i in serialized_node) {
      if (i == 'parent_handle' || i == 'children_handles') {continue;}
      if (serialized_node.hasOwnProperty(i)) {
        node[i] = serialized_node[i];
      }
    }
    handleTree.AddNode(node, h); 
  }

  // set the parents and children
  for (var h in serialized_tree) {
    var node = handleTree.handles[h];
    var parent_handle = serialized_tree[h].parent_handle;
    if (parent_handle) {node.parent = handleTree.handles[parent_handle];}

    var children_handles = serialized_tree[h].children_handles;
    for (var i in children_handles) {
      var handle = children_handles[i];
      node.children[handle] = handleTree.handles[handle];
    }
  }

  return handleTree;
}

module.exports.TreeNode = TreeNode;
module.exports = HandleTree;
module.exports.DeserializeHandleTree = DeserializeHandleTree;

//////////////
// TEST
//////////////

if (require.main === module) {
  var a = new TreeNode(null, {'type':  'a'});
  var b = new TreeNode(a, {'type': 'b'});
  var c = new TreeNode(a, {'type': 'c'});
  a.blah = 2;
  
  var handleTree = new HandleTree();
  handleTree.AddNode(a);
  handleTree.AddNode(b);
  handleTree.AddNode(c);
  
  console.log('SERIALIZED');
  var serialization = handleTree.Serialize();
  console.log(serialization);
  
  var handleTree2 = DeserializeHandleTree(serialization);
  
  console.log('RESERIALIZED');
  var reserialization = handleTree2.Serialize();
  console.log(reserialization);
}





