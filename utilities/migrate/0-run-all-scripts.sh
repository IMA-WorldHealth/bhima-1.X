#!/bin/bash
# USAGE: 

# author : jniles
# date   : January 12, 2014

USER=$1
PASS=$2
DB=$3

echo "Backing up current database to backup.sql ..."
sh 1-backup-current-db.sh $USER $PASS $DB

echo "Dropping triggers in $DB."
sh 2-drop-triggers.sh $USER $PASS $DB

echo "Dropping sym_* tables in $DB."
sh 3-drop-sym-tables.sh $USER $PASS $DB

echo "Running upgrade scripts on database."
sh 4-upgrade-to-v1.sh $USER $PASS $DB

echo "Completed migration."
