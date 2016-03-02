#!/bin/bash

declare -a all=(
ishandle
__is_handle_visible__
reset
set
get
__get__
__go_figure__
__calc_dimensions__
__go_axes__
__go_line__
__go_text__
__go_image__
__go_surface__
__go_patch__
__go_hggroup__
__go_delete__
__go_axes_init__
__go_handles__
__go_figure_handles__
__image_pixel_size__
drawnow
addproperty
waitfor
addlistener
dellistener
available_graphics_toolkits
register_graphics_toolkit
loaded_graphics_toolkits
__go_execute_callback__
__go_uimenu__
__go_uicontrol__
__go_uipanel__
__go_uicontextmenu__
__go_uitoolbar__
__go_uipushtool__
__go_uitoggletool__
)

declare -a progress=(
ishandle
__is_handle_visible__
)

declare -a remaining=(
reset
set
get
__get__
__go_figure__
__calc_dimensions__
__go_axes__
__go_line__
__go_text__
__go_image__
__go_surface__
__go_patch__
__go_hggroup__
__go_delete__
__go_axes_init__
__go_handles__
__go_figure_handles__
__image_pixel_size__
drawnow
addproperty
waitfor
addlistener
dellistener
available_graphics_toolkits
register_graphics_toolkit
loaded_graphics_toolkits
__go_execute_callback__
__go_uimenu__
__go_uicontrol__
__go_uipanel__
__go_uicontextmenu__
__go_uitoolbar__
__go_uipushtool__
__go_uitoggletool__
)

echo "number total:"
echo ${#all[@]} 

echo "number in progress:"
echo ${#progress[@]} 

echo "number remaining:"
echo ${#remaining[@]} 

FOLDER="graphics_objects"
mkdir -p $FOLDER

for i in ${remaining[@]}
do
  if [ -f $FOLDER/$i.m ]
  then
    echo "$i already exists. Removing then creating."
    rm -rf $FOLDER/$i.m
  else
    echo "Creating file for $i."
  fi
  touch $FOLDER/$i.m

  echo "% $i:  default unimplemented graphics_object mutator
function [result] = $i(varargin)
  disp('$i arguments:');
  for i = 1:nargin
    disp(sprintf('argument %d:', i));
    disp(varargin{i});
  end
  error('$i has yet to be implemented');

  a = struct();
  a.field = 'value';
  result = __send_go_message__('$i', a); 

endfunction" >> $FOLDER/$i.m
done
