#!/bin/bash
if [ $# -lt 1 ]
then
	echo "Usage: $0 <path>+"
	exit 1
fi

set -e


while (( "$#" )); do
  FILEPATH=`readlink -e $1`
  if [ -f $FILEPATH ]; then
    echo $FILEPATH
    /bin/sh /opt/web-terminal/scripts/send_message.sh SERVERMESSAGE '{"type":"set_frame", "to":"html", "id":1, "info": {"url": "localhost/home'$FILEPATH'" }}' 
  else
    echo "Error: $FILEPATH is not a file"
  fi
  # sleep 1 solves problem with not all files opening up
  shift
done

