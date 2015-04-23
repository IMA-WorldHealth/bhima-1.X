-- Updates to depot data
-- 
-- ADD 'is_warehouse' field
--
-- Date: 2015-02-20
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `depot`
ADD `is_warehouse` smallint unsigned not null default 0;
