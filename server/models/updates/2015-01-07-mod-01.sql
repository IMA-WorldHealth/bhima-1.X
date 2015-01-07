-- Updates to account data
-- Removal of the column `fixed` and `locked` from the table account
--
-- Date: 2015-01-07
-- By: CHRIS LOMAME

USE bhima;

ALTER TABLE `account` 
DROP `fixed`;

ALTER TABLE `account` 
DROP `locked`;

ALTER TABLE `account` 
ADD `is_asset` BOOLEAN NULL