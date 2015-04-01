-- Updates to rubric structure
-- 
-- ADD 'is_advance' field
--
-- Date: 2015-03-25
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `rubric`
ADD `is_advance` boolean;
