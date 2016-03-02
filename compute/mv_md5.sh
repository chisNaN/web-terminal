#!/bin/bash

# MOVE X to [prefix][md5][suffix], where [md5] is the md5 hash of the file X
# note: can use prefix to specify directories, suffix to specify extension

src=$1
prefix=$2
suffix=$3

md5=`md5sum $src`
set -- $md5
mv $src $prefix$1$suffix
