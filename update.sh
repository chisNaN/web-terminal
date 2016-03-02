#!/bin/bash
which dpkg
isDeb=$?
which rpm
isRpm=$?

if [ $isDeb == '0' ]; then
  if [ $isRpm == '0' ]; then
    echo "This is not a supported operating system"
    exit 1
  fi
fi

if [ $isDeb == 0 ]; then
  apt-get update
  update=$(apt-get -s install web-terminal | grep 'web-terminal is already the newest version.')
  if [ -z "$update" ]; then
    apt-get upgrade -y --force-yes web-terminal
    wait
    web-terminal restart
  fi
else
  update=$(yum list updates web-terminal | grep 'Updated Packages')
  if [ -n "$update" ]; then
    yum upgrade web-terminal -y
    wait
    web-terminal restart
  fi
fi
