#!/bin/bash
# author : jniles
# date   : January 12, 2015

# drops the triggers in a database
# USAGE: 1-dump-with-cols.sh [USER] [PASS] [DB]

# get params
USER=$1
PASS=$2
DB=$3

# dump the database
mysql -u $USER -p$PASS --skip-column-names $DB -e 'SHOW TRIGGERS;' | cut -f1 | sed -r 's/(.*)/DROP TRIGGER IF EXISTS \1;/' | mysql -u $USER -p$PASS $DB
