#!/bin/bash

# This assumes you run tests from the top level bhima directory.

echo "Building test database for integration tests ..."

# build the test database
mysql -u bhima -pHISCongo2013 -e "DROP DATABASE bhima_test;"
mysql -u bhima -pHISCongo2013 -e "CREATE DATABASE bhima_test;"
mysql -u bhima -pHISCongo2013 bhima_test -e "GRANT ALL ON bhima_test.* TO 'bhima'@'localhost' IDENTIFIED BY 'HISCongo2013';"
mysql -u bhima -pHISCongo2013 bhima_test < server/models/schema.sql
mysql -u bhima -pHISCongo2013 bhima_test < server/models/test/data.sql

echo "Building server ...."

# build and start the server
npm run dev &

# make sure we have enough time for the server to start
sleep 5

echo "Running tests ..."

# run the tests
mocha server/test/api/

echo "Cleaning up node instances ..."

# kill the server (and all other matching processes)
killall node
