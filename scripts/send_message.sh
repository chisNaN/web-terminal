#!/bin/sh

if [ $# -ne 2 ]
then
	echo "Usage: $0 <type (RPC, SERVERMESSAGE, CLIENTMESSAGE)> <json_message>"
	exit 1
fi

set -e

TYPE=$1
MESSAGE=$2

cat > /opt/web-terminal/local/node.fifo <<EOF
<$TYPE>
$MESSAGE
<END$TYPE>

EOF
