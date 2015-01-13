#!/bin/bash
# author : jniles
# date   : January 12, 2015

# performs a complete dump of the database, as a backup
# USAGE: 1-backup-current-DB.sh [USER] [PASS] [db]

# get params
USER=$1
PASS=$2
DB=$3

# dump the database
mysqldump -u $USER -p$PASS --databases $DB --add-drop-database --single-transaction --complete-insert > backups/backup-$(date +"%m-%d-%y-%T").sql 
