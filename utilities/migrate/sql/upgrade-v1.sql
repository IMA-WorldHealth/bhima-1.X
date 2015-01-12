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
-- Updates to debitor_group data
-- Removal of the column `payment_id` and `tax_id` from the table debitor_group
--
-- Date: 2015-01-07
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `debitor_group` 
DROP `payment_id`;

ALTER TABLE `debitor_group` 
DROP `tax_id`;-- Updates to account data
-- Removal of the column `fixed` and `locked` from the table account
--
-- Date: 2015-01-07
-- By: CHRIS LOMAME

USE bhima;

ALTER TABLE `account` 
DROP `fixed`;

ALTER TABLE `account` 
ADD `is_asset` BOOLEAN NULL;
-- written by jniles
-- Jan 7 2015

use bhima;

-- migrate old data
UPDATE account_type SET `type` = 'income' WHERE id = 1;
INSERT INTO account_type VALUES (4, 'expense');

-- remove poorly labeled income accounts
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 2 WHERE b.account_type_id = 1;

-- SET up income accounts AS OHADA
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 1 WHERE b.account_type_id != 3 and b.account_number like '6%';

-- SET up expense accounts AS OHADA
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 4 WHERE b.account_type_id != 3 and b.account_number like '7%';
-- Updates to fiscal year data
---
-- DROP 'closing_account' field
--
-- Date: 2015-01-07
-- By: Jonathan Niles

USE bhima;

ALTER TABLE `fiscal_year`
DROP FOREIGN KEY `fiscal_year_ibfk_1`;

-- ALTER TABLE `fiscal_year`
-- DROP `closing_account`;
