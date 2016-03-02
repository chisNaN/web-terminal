/////////////////////////////////////////////////////////
// PLACEMENT
/////////////////////////////////////////////////////////

function scale_and_preserve_aspect_ratio(div, container, original_width, original_height) {
  var container_height = container.height();
  var container_width = container.width();
  var scale = Math.min(container_height / original_height, container_width / original_width);
  var new_width = original_width * scale;
  var new_height = original_height * scale;
  div.width(new_width);
  div.height(new_height);
  div.css('margin-top', (container_height - new_height) / 2);
  div.css('margin-left', (container_width - new_width) / 2);
}

