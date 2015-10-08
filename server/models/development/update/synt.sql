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

INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `has_children`, `url`, `path`)
VALUES (114, 'compte de resultat', 'TREE.COMPTE_RESULTAT', 'pour voir le rapport de compte de resultat', 10, 0, '/partials/reports/result_account', '/reports/result_account/');


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
INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `has_children`, `url`, `path`) VALUES
(115, 'Dashboards', 'TREE.DASHBOARD.TITLE', 'Dashboards', 0, 1, '/partials/dashboards/', '/dashboards'),
(116, 'Finance Dashboar', 'TREE.DASHBOARD.FINANCE', 'Finance Dashboard', 115, 0, '/partials/dashboards/finance/finance.html', '/dashboards/finance');

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
INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `has_children`, `url`, `path`)
VALUES (117, 'Budget Analysis', 'TREE.BUDGET_ANALYSIS', 'analyse du budget courant avec les precedants', 8, 0, '/partials/budget/analysis', '/budgeting/analysis/');

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

-- Required definitions for report archive feature 
--
-- Date : 2015-09-11
-- @sfount
DROP TABLE IF EXISTS `report_archive`;
DROP TABLE IF EXISTS `report`;
CREATE TABLE `report` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(50) NOT NULL, 
  `title` varchar(255) NOT NULL,
  `description` text,
  `supports_pdf` boolean, 
  `supports_csv` boolean, 
  `supports_client` boolean,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- `last_updated` TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Experimental report options - these could be used to generate a CSV from a 
-- archived PDF, however this should be designed
DROP TABLE IF EXISTS `report_archive`;
CREATE TABLE `report_archive` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `report_id` smallint(5) unsigned NOT NULL,
  `user_id` smallint(5) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  `report_options` text,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `report_id` (`report_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `report_id` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`),
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Core BHIMA supported reports 
INSERT INTO `report` VALUES 
  (1, 'chart_of_accounts', 'Chart of Accounts', NULL, true, false, false, CURRENT_TIMESTAMP),
  (2, 'income_expense', 'Income vs. Expense', NULL, true, false, false, CURRENT_TIMESTAMP),
  (3, 'patient_invoices', 'Patient Invoices', NULL, true, false, false, CURRENT_TIMESTAMP); 
