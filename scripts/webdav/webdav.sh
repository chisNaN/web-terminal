#!/bin/sh

# See:
# http://www.howtoforge.com/how-to-set-up-webdav-with-apache2-on-centos-5.5

set -e

MY_CONFDIR="/srv/cloudlabs/scripts/webdav/webdav_httpd.conf";
CONFDIR="/etc/httpd/conf/httpd.conf";

echo Enter a directory:
read DIRECTORY

# remove trailing slashes, but ensure at least one
while [ ${#DIRECTORY} -gt 1 ] && [ ${DIRECTORY#${DIRECTORY%?}} == "/" ]; do
  DIRECTORY="${DIRECTORY%?}"
done
if [ ${DIRECTORY#${DIRECTORY%?}} != "/" ]; then
  DIRECTORY=${DIRECTORY}/
fi

# shopt -s extglob;
# DIRECTORY="${DIRECTORY%%+(/)}"

echo Enter a username:
read USERNAME

#PASSWORD="none";
#PASSWORD2="none2";
#
#while [  $PASSWORD !=  $PASSWORD2 ]; do
#  echo Enter a password:
#  read PASSWORD
#  echo Re-enter password:
#  read PASSWORD2
#done

mkdir -p $DIRECTORY
chown -R apache:apache $DIRECTORY
#chown apache:apache $DIRECTORY
echo Directory chowned
echo Be sure to choose a strong password!

PASSWD_DIR=${DIRECTORY}passwd.dav
htpasswd -c $PASSWD_DIR $USERNAME
chown root:apache $PASSWD_DIR
chmod 640 $PASSWD_DIR
echo Password file created

sed -e "s;\$REPLACE_DIR;$DIRECTORY;g" $MY_CONFDIR > $CONFDIR;
echo Conf modified

/etc/init.d/httpd reload
echo Apache reloaded
