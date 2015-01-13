-- drops all sym_* tables in the mysql database

USE bhima;

-- turn off foreign keys
SET FOREIGN_KEY_CHECKS=0;

-- compose query to drop all sym tables
SET @tables = NULL;

SELECT GROUP_CONCAT(table_schema, '.', table_name) INTO @tables FROM information_schema.tables 
WHERE table_schema = 'bhima' AND table_name LIKE BINARY 'sym_%';

SET @tables = CONCAT('DROP TABLE ', @tables);
PREPARE stmt1 FROM @tables;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- turn on foreign keys
SET FOREIGN_KEY_CHECKS=1;
