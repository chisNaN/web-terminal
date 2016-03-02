# install node modules
npm install

# build assets
npm run build

IDE_HOME="$(pwd)"
rm -f dev_pxy.conf
cp pxy.conf dev_pxy.conf
sed -i "s@/opt/web-terminal@$IDE_HOME@" dev_pxy.conf
sed -i 's@prod@dev@' dev_pxy.conf

# TODO: Add option to test this using pxy
/usr/local/openresty/nginx/sbin/nginx -c $IDE_HOME/dev_pxy.conf -s stop
/usr/local/openresty/nginx/sbin/nginx -c $IDE_HOME/dev_pxy.conf
