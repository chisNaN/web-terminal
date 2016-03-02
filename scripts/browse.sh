#!/bin/bash
if [ $# -lt 1 ]
then
	echo "Usage: $0 <url>+"
	exit 1
fi

set -e
URL=$1

/bin/sh /opt/web-terminal/scripts/send_message.sh SERVERMESSAGE '{"type":"set_frame", "to":"html", "id":1, "info": {"url": "'${URL/http:/https:}'" }}' 
