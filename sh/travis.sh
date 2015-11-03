#!/bin/bash

# change to the top-level bhima directory
#cd ..

# build the application
gulp build

# lint the client
gulp lint

# lint the server
jshint server/{controllers,lib,config}/*.js
jshint server/controllers/{analytics,depots,inventory,journal,ledgers,reports}/*.js
