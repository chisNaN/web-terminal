#!/bin/sh

if [ $# -ne 1 ]
then
	echo "Usage: $0 <FILEPATH>"
	exit 1
fi

set -e

FILEPATH=`readlink -f $1`
/bin/sh /opt/web-terminal/scripts/send_message.sh SERVERMESSAGE "{\"type\": \"list\", \"from\": \"files\", \"to\": \"computer\", \"passback\": \"main\", \"path\": \"$FILEPATH\"}"
cd $1
