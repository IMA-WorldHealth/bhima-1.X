-- Updates to debitor_group data
-- Removal of the column `payment_id` and `tax_id` from the table debitor_group
--
-- Date: 2015-01-07
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `debitor_group` 
DROP `payment_id`;

ALTER TABLE `debitor_group` 
DROP `tax_id`;