IDE_HOME="$(pwd)"
mkdir sbin
curl  http://openresty.org/download/ngx_openresty-1.7.2.1.tar.gz | tar xz -C /tmp
cd /tmp/ngx_openresty-1.7.2.1/
sed -i 's/nginx:\ /pxy: /' bundle/nginx-1.7.2/src/os/unix/ngx_setproctitle.c
./configure --prefix="/tmp/pxy" --sbin-path="$IDE_HOME/sbin/pxy" --conf-path="/opt/web-terminal/pxy.conf" --error-log-path="/opt/web-terminal/pxy/nginx/logs/error.log" --pid-path="/opt/web-terminal/pxy/nginx/logs/pxy.pid"
make
make install
cd $IDE_HOME
# bundles the pxy file into the folder p, which contains the binary and the dependencies
./bundle.sh -b sbin/pxy -o sbin/p
rm -f sbin/pxy
