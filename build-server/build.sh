#!/bin/bash

# This is the build script for the web-terminal build-server. 

# This code listens for github webhooks. When a commit is 
# pushed to master, this script is run to pull the new commit, 
# package it in deb or rpm form, and upload it to s3. This 
# code should NOT be included in the production packages

# find out whether or not this system supports deb or rpm
which dpkg
isDeb=$?
which rpm
isRpm=$?

# if the system supports neither, then we exit
if [ $isDeb == '0' ] && [ $isRpm == '0' ]; then
  echo "Building is only supported on dpkg or rpm compatible systems."
  exit 1
fi

# set version and iteration values if they don't exist
if [ ! -f iter ]; then
  echo 0 >> iter
fi

if [ ! -f version ]; then
  echo 0 >> version
fi

# quit if an error happens
set -e

# setup git repository
if [ ! -d web-terminal ]; then
  git clone git@github.com:terminalcloud/web-terminal.git
fi
cd web-terminal
git pull

# remove old binaries
rm -rf sbin

# copy device files that git doesn't include
cp -R ../node.fifo local/node.fifo
cp -R ../from_node.fifo local/from_node.fifo

# build assets
NODE_ENV='production'
./build.sh

# synchronize assets with s3
aws s3 sync public/ s3://cloudlabs.assets
cd ../

# test git repository
# Testing has to be run in development to work properly in a setting where web-terminal hasn't formally been installed
NODE_ENV=''

# get oldversion, current version, and current iteration
oldversion=$(cat version)
version=$(node extractVersion.js)
iter=$(cat iter)

# log what iteration we're on
echo "VERSION" >> log
cat version >> log
echo "ITER" >> log
cat iter >> log

# don't fail if tests fail so that we can report that tests failed
set +e
cd web-terminal/
mocha compute/tests/* >> log
result=$?
cd ../
set -e

# report results
### TODO: Have logs sent to slack, rather than posting directly to slack
echo "TEST RESULTS"
echo "TEST RESULTS" >> log
echo $result
if [ $result -eq 0 ]; then
  if [ $isDeb == 0 ]; then
    curl -X POST --data-urlencode "payload={\"text\": \"DEB Build tests have failed on version ${version} iteration ${iter}\"}" https://hooks.slack.com/services/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
    echo "DEB Build tests have failed on version ${version} iteration ${iter}" >> log
    exit 1
  fi
  if [ $isRPM == 0 ]; then
    curl -X POST --data-urlencode "payload={\"text\": \"RPM Build tests have failed on version ${version} iteration ${iter}\"}" https://hooks.slack.com/services/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
    echo "DEB Build tests have failed on version ${version} iteration ${iter}" >> log
    exit 1
  fi
fi

# increment iteration number if version number is the same, reset otherwise
if [ "$oldversion" == "$version" ]; then
  iter=$((iter+1))
  echo $iter > iter
else
  echo 0 > iter
  echo $version > version
fi


# build debian package and upload to s3 apt repository
if [ $isDeb == 0 ]; then
  echo Build DEB
  fpm -v ${version} --iteration ${iter} -d apache2-utils -s dir -t deb -n web-terminal ./web-terminal=/etc/ ./web-terminal/web-terminal=/usr/bin/web-terminal
  mv web-terminal_${version}-${iter}_amd64.deb /var/www/html/web-terminal_${version}-${iter}_amd64.deb
  cd /var/www/html
  apt-ftparchive packages ./ > Packages
  sed -i 's@\./web-terminal@web-terminal@g' Packages
  rm -f Packages.gz
  gzip -c Packages > Packages.gz
  aws s3 sync . s3://cloudlabs.apt.repo
fi


# build debian package and upload to s3 yum repository
if [ $isDeb == 0 ]; then
if [ $isRPM == 0 ]; then
  echo Build RPM
  fpm -v ${version} --iteration ${iter} -d httpd-tools -s dir -t rpm -n web-terminal ./web-terminal=/etc/ ./web-terminal/web-terminal=/usr/bin/web-terminal
  mv web-terminal-${version}-${iter}.x86_64.rpm /var/www/html/web-terminal-${version}-${iter}.x86_64.rpm
  cd /var/www/html
  createrepo ./
  aws s3 sync . s3://cloudlabs.yum.repo
fi

# clear folder where things are built so that packages don't build up locally
rm -rf /var/www/html/*

