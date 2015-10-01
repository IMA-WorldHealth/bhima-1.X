USE bhima;


-- Jonathan Niles
-- 11/08/2015
-- Change the journal URL to /journal rather than /posting_journal
UPDATE unit SET `url` = '/partials/journal/journal.html', `path` = '/journal' WHERE id = 9;

--
-- Dedrick Kitamuka
-- 22/07/2015
-- Adding a new unit for resultat comptable
--

INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`)
VALUES (114, 'compte de resultat', 'TREE.COMPTE_RESULTAT', 'pour voir le rapport de compte de resultat', 10, '/partials/reports/result_account', '/reports/result_account/');


-- Updates table account
-- Updating the is_asset column following the accounting standard
--
-- Date: 2015-08-04
-- By: Chris LOMAME

UPDATE `account` SET `is_asset`=FALSE;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=2 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=3 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=41 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,4)=4711 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=476 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=478 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=5 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=6 AND account_number AND `account_number` NOT LIKE '603%' AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=73 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=81 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=83 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=85 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=89 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=NULL WHERE `parent`=0 AND `is_ohada` =1;


USE bhima;

-- Update all inventory type where inventory type is assembly to Article
--
-- Date: 2015-08-11
-- By: Chris LOMAME

UPDATE `inventory` SET `inventory`.`type_id` = 1, `inventory`.`consumable` = 1  WHERE `inventory`.`type_id` = 2;


USE bhima;

-- Remove inventory type Discount
--
-- Date: 2015-08-11
-- By: Chris LOMAME

DELETE FROM `inventory_type` WHERE `inventory_type`.`id` = 4;


-- Update user table
-- Change logged_in to online
-- Add column last_login DATE
-- Encrypt user passwords
--
-- Date: 2015-08-13
-- By: jniles
ALTER TABLE `user` CHANGE `logged_in` `active` TINYINT NOT NULL DEFAULT 0;
ALTER TABLE `user` ADD COLUMN `last_login` DATE NOT NULL;
UPDATE `user` SET `password` = PASSWORD(`password`);

-- Add Dashboards leaf to tree, with finance dashboard child
--
-- Date: 2015-08-25
-- By: jniles
INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`) VALUES
(115, 'Dashboards', 'TREE.DASHBOARD.TITLE', 'Dashboards', 0, '/partials/dashboards/', '/dashboards'),
(116, 'Finance Dashboar', 'TREE.DASHBOARD.FINANCE', 'Finance Dashboard', 115, '/partials/dashboards/finance/finance.html', '/dashboards/finance');

-- Adding column is_charge 
-- Date: 2015-08-20
-- By: Chris LOMAME
--
ALTER TABLE `account`
ADD `is_charge` BOOLEAN NULL;


USE bhima;

-- Updates table account
-- Updating the column is_charge column following the accounting standard OHADA
--
-- Date: 2015-08-20
-- By: Chris LOMAME

UPDATE `account` SET `is_charge`= NULL;
UPDATE `account` SET `is_charge` =1 WHERE `classe`=6 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=81 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=83 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=85 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=89 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE `classe`=7 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=82 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=84 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=86 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=88 AND `account_type_id` =1 AND `is_ohada` =1;


USE bhima;

-- Updating some Elements of table transaction_type
--
-- Date: 2015-08-27
-- By: Chris LOMAME

-- Delete transaction_type purchase unused
DELETE FROM `transaction_type` WHERE `transaction_type`.`id` = 3;


UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'import_automatique' WHERE  `transaction_type`.`id` =9;
UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'group_deb_invoice' WHERE  `transaction_type`.`id` =5;
UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'stock_loss' WHERE  `transaction_type`.`id` =13;
UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'reversing_stock' WHERE  `transaction_type`.`id` =28;

USE bhima;

-- Create new units relatives to Budget Module
-- 
-- Date: 2015-09-03
-- By: Bruce MBAYO

-- Budget Analysis
INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`)
VALUES (117, 'Budget Analysis', 'TREE.BUDGET_ANALYSIS', 'analyse du budget courant avec les precedants', 8, '/partials/budget/analysis', '/budgeting/analysis/');

-- rm unused currency tree node
--
-- Date: 2015-08-31
-- By: jniles

DELETE FROM `unit` WHERE id = 33;

-- Update currency, decoupling format and definition to utilise locale format 
-- 
-- Date : 2015-09-01
-- @sfount
ALTER TABLE `currency` DROP COLUMN `separator`;
ALTER TABLE `currency` DROP COLUMN `decimal`;
ALTER TABLE `currency` ADD `format_key` VARCHAR(20) AFTER `name`;
UPDATE `currency` SET `format_key` = 'fc' WHERE id = 1;
UPDATE `currency` SET `format_key` = 'usd' WHERE `id` = 2;
ALTER TABLE `currency` MODIFY `format_key` VARCHAR(20) NOT NULL;

-- Updates to unit table
-- 
-- DROPs unused has_children field
--
-- Date: 2015-01-11
-- By: Jonathan Niles
-- Restaure by : Chris Lomame
-- Restaure date : 2015-09-04

USE bhima;

ALTER TABLE `unit`
DROP `has_children`;



-- Restaure OLD UNIT Report of tax paiement and cotisation paiement
--
-- Date: 2015-09-09
-- By : Chris Lomame

INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`) VALUES
(118, 'Report Taxes paiments', 'TREE.REPORT_TAXES', 'Report taxes paiements', 10, '/partials/reports/taxes_payment/', '/reports/taxes_payment/'),
(119, 'Report Cotisation paiements', 'TREE.REPORT_COTISATION', 'Report Cotisation paiements', 10, '/partials/reports/cotisation_payment/', '/reports/cotisation_payment/');


-- Update field of table tax
--
-- Date: 2015-09-09
-- By : Chris Lomame

ALTER TABLE `tax`
CHANGE `is_employee` `is_employee` tinyint(1) DEFAULT '0';

ALTER TABLE `tax`
CHANGE `is_percent` `is_percent` tinyint(1) DEFAULT '0';

ALTER TABLE `tax`
CHANGE `is_ipr` `is_ipr` tinyint(1) DEFAULT '0';

-- Update field of table cotisation
--
-- Date: 2015-09-09
-- By : Chris Lomame

ALTER TABLE `cotisation`
CHANGE `is_employee` `is_employee` tinyint(1) DEFAULT '0';

ALTER TABLE `cotisation`
CHANGE `is_percent` `is_percent` tinyint(1) DEFAULT '0';


-- Update field of table rubric
--
-- Date: 2015-09-09
-- By : Chris Lomame

ALTER TABLE `rubric`
CHANGE `is_discount` `is_discount` tinyint(1) DEFAULT '0';
ALTER TABLE `rubric`  
CHANGE `is_percent` `is_percent` tinyint(1) DEFAULT '0';
ALTER TABLE `rubric`  
CHANGE `is_advance` `is_advance` tinyint(1) DEFAULT '0';
ALTER TABLE `rubric`  
CHANGE `is_social_care` `is_social_care` tinyint(1) DEFAULT '0';

-- Drop column location_id from table supplier 
-- Date: 2015-09-14
-- By: Chris LOMAME
--
USE bhima;

ALTER TABLE  `supplier` 
DROP FOREIGN KEY  `supplier_ibfk_1` ;

ALTER TABLE `supplier`
DROP `location_id`;


-- Deletion of undeveloped reports
--
-- Date: 2015-09-14
-- By : Chris Lomame

DELETE FROM `permission` WHERE `permission`.`unit_id` = 90;
DELETE FROM `permission` WHERE `permission`.`unit_id` = 91;
DELETE FROM `permission` WHERE `permission`.`unit_id` = 91;


DELETE FROM `unit` WHERE `unit`.`id` = 90;
DELETE FROM `unit` WHERE `unit`.`id` = 91;
DELETE FROM `unit` WHERE `unit`.`id` = 92;


-- Alter enterprise data
-- Date: 2015-09-17
-- By: Bruce Mbayo

UPDATE `enterprise` 
SET `name`='Institut Médical Chrétien du Kasaï' 
WHERE `id`=200;

-- Transaction type : groupe invoice
-- server/controllers/journal/finance.js use it in cancelInvoice()
-- Date: 2015-09-21
-- By: Bruce Mbayo

INSERT INTO `transaction_type` (`service_txt`) 
VALUES ('group_invoice');


-- Alter cost center, service
-- Date: 2015-09-22
-- By: Bruce M.

ALTER TABLE  `cost_center` 
DROP FOREIGN KEY  `cost_center_ibfk_1` ;

ALTER TABLE  `service` 
DROP FOREIGN KEY  `service_ibfk_1` ;

--
-- Dedrick Kitamuka
-- 22/09/2015
-- Adding a new unit for debtor group pdf report
--

INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`)
VALUES (120, 'Rapport situation group debiteur', 'TREE.DEBITOR_GROUP_REPORT', 'pour voir le rapport pdf detaille de group de debiteur', 10, '/partials/reports/debitor_group_report', '/reports/debitor_group_report/');

-- Update account parent to account.is instead of account_number
-- Date: 2015-10-01
-- By: Bruce M.

UPDATE account a JOIN account b ON a.parent=b.account_number 
SET a.parent=b.id;