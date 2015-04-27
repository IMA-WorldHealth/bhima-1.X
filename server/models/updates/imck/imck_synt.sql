-- Updates account
--
-- ADD 'is_ohada' field
--
-- Date: 2015-04-27
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `account`
ADD `is_ohada` BOOLEAN NULL;
