-- Updates purchase structure
-- 
-- ADD 'header_id' field
-- ADD 'issuer_id' field
-- 
-- Date: 2015-04-07
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `purchase`
ADD `header_id` int unsigned not null;

ALTER TABLE `purchase`
ADD `issuer_id` int unsigned not null;
