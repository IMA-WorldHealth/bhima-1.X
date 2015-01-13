#!/bin/bash
# author : jniles
# date   : January 12, 2015

# Runs the upgrade script in sql/upgrade.sql
# USAGE: 4-ugrade-database.sh

# get params
USER=$1
PASS=$2
DB=$3
FILE="sql/upgrade.sql"

if [ ! -f $FILE ]; then
  echo "Cannot find the upgrade file : $FILE"
  exit 0
fi

mysql -u $USER -p$PASS < $FILE
