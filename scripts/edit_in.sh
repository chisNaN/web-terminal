#!/bin/bash

set -e

while read line
do
  FILEPATH=`readlink -e $line`
  if [ -f $FILEPATH ]; then
    echo $FILEPATH
    /bin/sh /opt/web-terminal/scripts/send_message.sh SERVERMESSAGE "{\"type\": \"edit\", \"path\": \"$FILEPATH\"}"
  else
    echo "Error: $FILEPATH is not a file"
  fi
  shift
done
