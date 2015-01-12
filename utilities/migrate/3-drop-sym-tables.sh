#!/bin/bash
# author : jniles
# date   : January 12, 2015

# drops sym-tables from the existing database
# USAGE: 2-drop-sym-tables.sh

# get params
USER=$1
PASS=$2
DB=$3

mysql -u $USER -p$PASS < sql/drop-sym-tables.sql
