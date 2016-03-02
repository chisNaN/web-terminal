# Terminal-IDE

Standalone Server + Client for remote machine introspection and development.

## TODO:

Reorganize nginx to consolidate similar folders with clear names and remove superfluous routes. 
Clean up superflous files.
Replace constants.js with json file;

## How it works

The Terminal IDE server is composed of three different parts: a node server, a nginx proxy server, and a terminal instance manager (ptyserved).

### Node Server

The node server provides all the front-end assets to the user. These assets are all compiled by Gulp, except for the primary index.html.

### Proxy

The nginx proxy server redirects to various assets held in various locations. The CL folder holds temporary files created and used by the node server, as well as ptyserved and ptyclient. The local folder holds fifo files to enable processes to communicate with one another, as well as chat.db, history.i.txt, history.o.txt. cloudlabs_layout.js and ipc_instance.json are kept in /tmp/. 

### ptyserved 

ptyseved manages the terminal instances that appear in the ide. The node server interacts with the ptdclient to create new terminals and shut them down.

### Scripts folder

The scripts folder mostly contains scripts to get information about the underlying file system for the files section of the IDE. The other scripts are presumably for doing things as named, but not sure if we still use all of them.

## Build Process

When a commit is made to "master", or "production", a github webhook notifies the two build servers. We have one for rpm packages and one for deb packages.

Once the request is recieved, the servers run the script build-server/build.sh. This script will, in this order: 

1. Pull the new changes
2. Run the mocha tests
3. Build the assets
4. Upload the assets
5. Test the binaries
6. Delete superfluous files
7. Create deb/rpm package
8. Generate repo info for deb/rpm package
9. Upload to S3.
10. Clean up files.
