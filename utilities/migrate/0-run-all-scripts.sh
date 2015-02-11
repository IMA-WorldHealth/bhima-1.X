#!/bin/bash
# USAGE: sh 0-run-all-scripts [USER] [PASS] [DB]

# author : jniles
# date   : January 12, 2014

USER=$1
PASS=$2
DB=$3

# if there are no arguments, print usage
if [ -z "$1" ]; then
  echo "USAGE: sh 0-run-all-scripts [USER] [PASS] [DB]"
  exit 0
fi


echo "Backing up current database to backup.sql ..."
sh 1-backup-current-db.sh $USER $PASS $DB

echo "Dropping triggers in $DB."
sh 2-drop-triggers.sh $USER $PASS $DB

echo "Dropping sym_* tables in $DB."
sh 3-drop-sym-tables.sh $USER $PASS $DB

echo "Running upgrade scripts on database."
sh 4-upgrade-database.sh $USER $PASS $DB

echo "Completed migration."
