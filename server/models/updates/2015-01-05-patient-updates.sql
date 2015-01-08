-- Updates to patient data
---
-- RENAME addr_1 to address_1
-- RENAME addr_2 to address_2
-- CHANGE length of email column to 40 characters
-- ADD 'title' field
--
-- Date: 2015-01-05
-- By: Jonathan Cameron

USE bhima;

ALTER TABLE `patient`

CHANGE `addr_1` `address_1` varchar(100);

ALTER TABLE `patient`
CHANGE `addr_2` `address_2` varchar(100);

ALTER TABLE `patient`
CHANGE `email` `email` varchar(40);

ALTER TABLE `patient`
ADD `title` VARCHAR(30);
