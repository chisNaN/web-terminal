#!/bin/bash

set -e

USAGE="$(basename "$0") [-h] [-o OUTFOLDER] -b BINARY -- Bundle a binary for use across containers

-h  show this help text
-b  binary to bundle
-o  folder into which to place the bundle (default=./bundle-BINARY)"

while getopts "ho:b:" opt; do

  case $opt in
    h)
      echo "$USAGE"
      exit 0
      ;;
    o)
      OUT=$OPTARG
      ;;
    b)
      BIN=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      echo "$USAGE" >&2
      exit 10
      ;;
  esac
done

if [ -z "$BIN" ]; then
  echo "No binary to bundle" >&2
  echo "$USAGE" >&2
  exit 11
fi
if [ ! -f "$BIN" ]; then
  echo "Given binary is not a file" >&2
  echo "$USAGE" >&2
  exit 12
fi

OUT=${OUT:-"bundle-$BIN"}

install_patchelf() {
  rm -rf /tmp/patchelf-0.8
  curl -L http://nixos.org/releases/patchelf/patchelf-0.8/patchelf-0.8.tar.gz | tar xz -C /tmp
  cd /tmp/patchelf-0.8
  ./configure
  make
  make install
  cd -
}

install_lddr() {
  curl -L https://raw.githubusercontent.com/terminalcloud/lddr/master/lddr > /sbin/lddr
  chmod +x /sbin/lddr
}

# Fetch dependencies
which patchelf >/dev/null || install_patchelf
which lddr >/dev/null || install_lddr

# Copy linked libraries
rm -rf /tmp/CL/bundle/$BIN
mkdir -p /tmp/CL/bundle/$BIN/deps
lddr $BIN > /tmp/CL/bundle/$BIN/depslist
cat /tmp/CL/bundle/$BIN/depslist | xargs -I {} cp {} /tmp/CL/bundle/$BIN/deps/
rm /tmp/CL/bundle/$BIN/depslist
rm -f /tmp/CL/bundle/$BIN/deps/libc.*

# Copy the binary
cp $BIN /tmp/CL/bundle/$BIN/bin

# Bundle the binary with its linked libraries
patchelf --set-rpath "\${ORIGIN}/deps" /tmp/CL/bundle/$BIN/bin

# TODO: Send the bundle to an API
mv /tmp/CL/bundle/$BIN $OUT
