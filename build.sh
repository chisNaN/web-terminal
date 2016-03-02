# install node modules
npm install --build-from-source

# build css, js,and html assets
NODE_ENV='production' npm run build

# builds nginx (needs to be newly built on each type of system)
./nginx.sh

# copies node and bundles it for use
cp $(which node) sbin/node
./bundle.sh -b sbin/node -o sbin/n
rm -f sbin/node

# remove dependencies so that they don't interfere with libraries provided by the system
rm -rf sbin/n/deps

rm -rf node_modules
npm install --build-from-source --production
npm ddp
rm -rf node_modules/sqlite3/build

# make forever use our custom node, rather than default:
sed -i 's@#!/usr/bin/env node@#!/opt/web-terminal/sbin/n/bin@' node_modules/forever/bin/forever
