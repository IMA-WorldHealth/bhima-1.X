#!/bin/bash

read -p "Enter your mysql user (default root): " user
user=${user:-root}

echo -n "Enter password: " 
read -s pw
echo

echo "Rebuilding the database ..."

# rebuild database
mysql -u $user -p$pw -e "DROP DATABASE bhima;"
mysql -u $user -p$pw -e "CREATE DATABASE bhima;"
mysql -u $user -p$pw bhima < server/models/schema.sql
mysql -u $user -p$pw -e "SET foreign_key_checks = 0;"
mysql -u $user -p$pw bhima < server/models/development/data.sql
mysql -u $user -p$pw -e "SET foreign_key_checks = 1;"
