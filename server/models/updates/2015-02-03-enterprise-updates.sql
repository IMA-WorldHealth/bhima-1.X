-- Updates to enterprise data
-- 
-- ADD 'po_box' field
--
-- Date: 2015-02-03
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `enterprise`
ADD `po_box` VARCHAR(30);
