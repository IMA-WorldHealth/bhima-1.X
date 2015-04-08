USE bhima;

-- Updates to patient data
--
-- RENAME addr_1 to address_1
-- RENAME addr_2 to address_2
-- CHANGE length of email column to 40 characters
-- ADD 'title' field
--
-- Date: 2015-01-05
-- By: Jonathan Cameron
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
ALTER TABLE `debitor_group`
DROP `payment_id`;

ALTER TABLE `debitor_group`
DROP `tax_id`;-- Updates to account data

ALTER TABLE `account`
ADD `is_asset` BOOLEAN NULL;-- written by jniles
-- Jan 7 2015

--
-- Date: 2015-02-23
-- By: Chris LOMAME

USE bhima;

INSERT INTO `account_type` VALUES (4,'expense');

ALTER TABLE `account`
ADD FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`);

-- remove poorly labeled income accounts
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 2 WHERE b.account_type_id = 1;
-- set up income accounts as OHADA
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 1 WHERE b.account_type_id != 3 AND b.account_number LIKE '6%';
-- set up expense accounts as OHADA
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 4 WHERE b.account_type_id != 3 AND b.account_number LIKE '7%';



-- Updates to fiscal year data
--
-- DROP 'closing_account' field
--
-- Date: 2015-01-07
-- By: Jonathan Niles

-- ALTER TABLE `fiscal_year`
-- DROP FOREIGN KEY `fiscal_year_ibfk_1`;

-- ALTER TABLE `fiscal_year`
-- DROP `closing_account`;


-- Updates to patient data
--
-- Add patient 'notes' field
--
-- Date: 2015-01-12
-- By: Jonathan Cameron
ALTER TABLE `patient`
ADD `notes` text;


-- Update to units/menu
--
-- Add add menu/unit item for the budget menu item.
-- Date: 2015-01-13
-- By: Jonathan Cameron
INSERT INTO `unit` VALUES
(7,'Edit Account Budget','TREE.EDIT_BUDGET','',8,0,'/partials/budget/edit/','/budgeting/edit'),
(34,'Auxillary cash records','TREE.AUXILLARY_CASH_RECORD','',5,0,'/partials/records/auxillary_cash_records/','/auxillary_cash_records/');


-- Subsidy updating
--
-- CHANGE price_list_uuid, subsidy_uuid to be not requirement
-- ADD subsidy and sale_subsidy tables
--
-- Date: 2015-01-13
-- By: Dedrick Kitamuka

drop table if exists `subsidy`;
CREATE TABLE `subsidy` (
  `uuid`                   char(36) not null,
  `text`                   text,
  `value`                  float default 0,
  `is_percent`             boolean,
  `debitor_group_uuid`     char(36) not null,
  primary key (`uuid`),
  key `debitor_group_uuid` (`debitor_group_uuid`),
  constraint foreign key (`debitor_group_uuid`) references `debitor_group` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `patient_group`
MODIFY `price_list_uuid` char(36) null;

ALTER TABLE `patient_group`
ADD `subsidy_uuid` char(36) null;

ALTER TABLE `patient_group`
ADD FOREIGN KEY (`subsidy_uuid`) references `subsidy` (`uuid`);

DROP TABLE IF EXISTS `sale_subsidy`;
CREATE TABLE `sale_subsidy` (
  `uuid`              char(36) not null,
  `sale_uuid`         char(36) not null,
  `subsidy_uuid`      char(36) not null,
  `value`             decimal(19,4) default '0',
  primary key (`uuid`),
  key `sale_uuid` (`sale_uuid`),
  key `subsidy_uuid` (`subsidy_uuid`),
  constraint foreign key (`sale_uuid`) references `sale` (`uuid`) on delete cascade,
  constraint foreign key (`subsidy_uuid`) references `subsidy` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- cash canceling
--
-- ADD cash_discard table
--
-- Date: 2015-03-11
-- By: Dedrick Kitamuka

DROP TABLE IF EXISTS `cash_discard`;

CREATE TABLE `cash_discard` (
  `project_id` smallint(5) unsigned NOT NULL,
  `reference` int(10) unsigned NOT NULL,
  `uuid` char(36) NOT NULL,
  `cost` decimal(19,4) unsigned NOT NULL,
  `debitor_uuid` char(36) NOT NULL,
  `cashier_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `cash_uuid` char(36) NOT NULL,
  `date` date NOT NULL,
  `description` text,
  `posted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debitor_uuid` (`debitor_uuid`),
  KEY `cash_uuid` (`cash_uuid`),
  CONSTRAINT `cash_discard_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `cash_discard_ibfk_2` FOREIGN KEY (`debitor_uuid`) REFERENCES `debitor` (`uuid`),
  CONSTRAINT `cash_discard_ibfk_3` FOREIGN KEY (`cash_uuid`) REFERENCES `cash` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- deleting tables relatives to caution
--
-- DROP TABLES caution, caution_box, caution_box_account_currency
--
-- Date: 2015-03-11
-- By: Dedrick Kitamuka

DROP TABLE IF EXISTS `caution_box_account_currency`;
DROP TABLE IF EXISTS `caution_box`;
DROP TABLE IF EXISTS `caution`;

-- adding a columns for exchange operation and foreign key
--
-- ALTER TABLE cash_box_account_currency
--
-- Date: 2015-03-14
-- By: Dedrick Kitamuka

ALTER TABLE `cash_box_account_currency`
ADD `gain_exchange_account_id` int(10) unsigned default 981;

ALTER TABLE `cash_box_account_currency`
ADD `loss_exchange_account_id` int(10) unsigned default 718;

ALTER TABLE `cash_box_account_currency`
ADD FOREIGN KEY (`gain_exchange_account_id`) REFERENCES `account` (`id`);

ALTER TABLE `cash_box_account_currency`
ADD FOREIGN KEY (`loss_exchange_account_id`) REFERENCES `account` (`id`);







-- Allow an employee lock
-- Date: 2015-01-26
-- By: Chris LOMAME
ALTER TABLE `employee`
ADD `locked` boolean;


-- INSERT new parents class and UPDATE depending accounts
-- UPDATE is_asset (passive or active)
-- Date: 2015-01-29
-- By: Bruce Mbayo

-- Get the last id
SET @AUTO_ID = NULL;
SELECT `AUTO_INCREMENT` INTO @AUTO_ID
FROM  INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'bhima'
AND   TABLE_NAME   = 'account';

-- Setting up id for new parent class
-- FIXME naive incrementation method
SET @ID_18 = @AUTO_ID;
SET @ID_29 = @AUTO_ID + 1;
SET @ID_30 = @AUTO_ID + 2;
SET @ID_32 = @AUTO_ID + 3;
SET @ID_34 = @AUTO_ID + 4;
SET @ID_36 = @AUTO_ID + 5;
SET @ID_38 = @AUTO_ID + 6;
SET @ID_35 = @AUTO_ID + 7;
SET @ID_33 = @AUTO_ID + 8;
SET @ID_46 = @AUTO_ID + 9;
SET @ID_466 = @AUTO_ID +10;
SET @ID_48 = @AUTO_ID + 11;
SET @ID_49 = @AUTO_ID + 12;
SET @ID_42 = @AUTO_ID + 13;
SET @ID_5734 = @AUTO_ID + 14;
SET @ID_5735 = @AUTO_ID + 15;
SET @ID_61 = @AUTO_ID + 16;
SET @ID_613 = @AUTO_ID + 17;
SET @ID_6131 = @AUTO_ID + 18;
SET @ID_616 = @AUTO_ID + 19;
SET @ID_619 = @AUTO_ID + 20;
SET @ID_62 = @AUTO_ID + 21;
SET @ID_628 = @AUTO_ID + 22;
SET @ID_6334 = @AUTO_ID + 23;
SET @ID_68 = @AUTO_ID + 24;
SET @ID_70 = @AUTO_ID + 25;
SET @ID_71 = @AUTO_ID + 26;
SET @ID_72 = @AUTO_ID + 27;
SET @ID_7614 = @AUTO_ID + 28;
SET @ID_7615 = @AUTO_ID + 29;
SET @ID_78 = @AUTO_ID + 30;

-- adding missing parent class
INSERT INTO `account` VALUES
(@ID_18, 3, 200, 18, 'PROVISIONS', 1, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 1, NULL),
(@ID_29, 3, 200, 29, 'IMMOBILISATIONS', 25, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 2, NULL),
(@ID_30, 3, 200, 30, 'STOCKS  MEDICAMENTS', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3, NULL),
(@ID_32, 3, 200, 32, 'Emballages commerciaux', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3, NULL),
(@ID_34, 3, 200, 34, 'Produits ophtalmologie', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3, NULL),
(@ID_36, 3, 200, 36, 'SPROVISION POUR DEPRECIATION', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3, NULL),
(@ID_35, 3, 200, 35, 'ACCOUCHEMENT', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3, NULL),
(@ID_33, 3, 200, 33, 'EXTERNE', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3, NULL),
(@ID_46, 3, 200, 46, 'DEBITEURS ET CREDITEURS DIVERS', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4, NULL),
(@ID_466, 3, 200, 466, 'AUTRES DEBITEURS ET CREDITEURS', @ID_46, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4, NULL),
(@ID_48, 3, 200, 48, 'PROVISIONS POUR IMPAYES MALADES', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4, NULL),
(@ID_49, 3, 200, 49, 'COMPTE D\'ATTENTE (ACTIF)', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4, NULL),
(@ID_42, 3, 200, 42, 'MALADES HOSPITALISES', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4, NULL),
(@ID_5734, 3, 200, 5734, 'ROW', 490, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 5, NULL),
(@ID_5735, 3, 200, 5735, 'UNICEF', 490, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 5, NULL),
(@ID_61, 3, 200, 61, 'CONSOMMATIONS FOURNITURES', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_613, 3, 200, 613, 'MATERIELS ET EQUIPEMENTS', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_6131, 3, 200, 6131, 'Matériel et équipement administratif', @ID_613, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_616, 3, 200, 616, 'Consommable et matériel d\'entretien hospitalier', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_619, 3, 200, 619, 'AUTRES FOURNITURES', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_62, 3, 200, 62, 'TRANSPORT CONSOMME', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_628, 3, 200, 628, 'DIVERS FRAIS DE VOYAGE', @ID_62, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_6334, 3, 200, 6334, 'ROW', 660, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_68, 3, 200, 68, 'DOTATIONS', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6, NULL),
(@ID_70, 3, 200, 70, 'VENTE MEDICAMENTS', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7, NULL),
(@ID_71, 3, 200, 71, 'ACTES/PRODUCTIONS VENDUES', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7, NULL),
(@ID_72, 3, 200, 72, 'PRODUCTIONS STOCKEES', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7, NULL),
(@ID_7615, 3, 200, 7615, 'DIVERS', 989, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7, NULL),
(@ID_7614, 3, 200, 7614, 'ROW', 989, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7, NULL),
(@ID_78, 3, 200, 78, 'REPRISE SUBVENTION D\'EQUIPEMENT', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7, NULL);

-- update accounts which dont't have parent or a correct parent
UPDATE `account` SET `parent`=@ID_18 WHERE LEFT(`account_number`,2)=18 AND `account_number`<>18;
UPDATE `account` SET `parent`=@ID_29 WHERE LEFT(`account_number`,2)=29 AND `account_number`<>29;
UPDATE `account` SET `parent`=@ID_30 WHERE `account_number`=3001;
UPDATE `account` SET `parent`=@ID_32 WHERE LEFT(`account_number`,2)=32 AND `account_number`<>32;
UPDATE `account` SET `parent`=@ID_34 WHERE LEFT(`account_number`,2)=34 AND `account_number`<>34;
UPDATE `account` SET `parent`=@ID_36 WHERE LEFT(`account_number`,2)=36 AND `account_number`<>36;
UPDATE `account` SET `parent`=@ID_38 WHERE LEFT(`account_number`,2)=38 AND `account_number`<>38;
UPDATE `account` SET `parent`=@ID_35 WHERE LEFT(`account_number`,2)=35 AND `account_number`<>35;
UPDATE `account` SET `parent`=@ID_33 WHERE LEFT(`account_number`,2)=33 AND `account_number`<>33;
UPDATE `account` SET `parent`=@ID_46 WHERE `account_number` IN (462, 463, 464);
UPDATE `account` SET `parent`=@ID_466 WHERE LEFT(`account_number`,3)=466 AND `account_number`<>466;
UPDATE `account` SET `parent`=@ID_48 WHERE LEFT(`account_number`,2)=48 AND `account_number`<>48;
UPDATE `account` SET `parent`=@ID_49 WHERE LEFT(`account_number`,2)=49 AND `account_number`<>49;
UPDATE `account` SET `parent`=@ID_42 WHERE `account_number`=42771105;
UPDATE `account` SET `parent`=490 WHERE LEFT(`account_number`,4)=5730 AND `account_number`<>5730;
UPDATE `account` SET `parent`=@ID_5734 WHERE LEFT(`account_number`,4)=5734 AND `account_number`<>5734;
UPDATE `account` SET `parent`=@ID_5735 WHERE LEFT(`account_number`,4)=5735 AND `account_number`<>5735;
UPDATE `account` SET `parent`=@ID_61 WHERE LEFT(`account_number`,2)=61 AND `account_number`<>61;
UPDATE `account` SET `parent`=@ID_6131 WHERE LEFT(`account_number`,4)=6131 AND `account_number`<>6131;
UPDATE `account` SET `parent`=@ID_616 WHERE LEFT(`account_number`,3)=616 AND `account_number`<>616;
UPDATE `account` SET `parent`=@ID_619 WHERE LEFT(`account_number`,3)=619 AND `account_number`<>619;
UPDATE `account` SET `parent`=@ID_62 WHERE LEFT(`account_number`,2)=62 AND `account_number`<>62;
UPDATE `account` SET `parent`=@ID_628 WHERE LEFT(`account_number`,3)=628 AND `account_number`<>628;
UPDATE `account` SET `parent`=@ID_6334 WHERE LEFT(`account_number`,4)=6334 AND `account_number`<>6334;
UPDATE `account` SET `parent`=@ID_68 WHERE LEFT(`account_number`,2)=68 AND `account_number`<>68;
UPDATE `account` SET `parent`=@ID_70 WHERE LEFT(`account_number`,2)=70 AND `account_number`<>70;
UPDATE `account` SET `parent`=@ID_71 WHERE LEFT(`account_number`,2)=71 AND `account_number`<>71;
UPDATE `account` SET `parent`=@ID_72 WHERE LEFT(`account_number`,2)=72 AND `account_number`<>72;
UPDATE `account` SET `parent`=@ID_7615 WHERE LEFT(`account_number`,4)=7615 AND `account_number`<>7615;
UPDATE `account` SET `parent`=@ID_7614 WHERE LEFT(`account_number`,4)=7614 AND `account_number`<>7614;
UPDATE `account` SET `parent`=@ID_78 WHERE LEFT(`account_number`,2)=78 AND `account_number`<>78;

-- Uppercase 1 and 2 digits account class
UPDATE `account` SET `account_txt`='MATIERES ET FOURNITURES CONSOMMEES' WHERE `account_number`=31;
UPDATE `account` SET `account_txt`=UPPER(`account_txt`) WHERE `parent` IN (0, 1, 25, 89, 184, 473, 535, 888, 1046);

-- update active or passive
-- TRUE for active or FALSE for passive
UPDATE `account` SET `is_asset`=FALSE WHERE `classe`=1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=2;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=3;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=40;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=41;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=42;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=43;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=462;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=463;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,3)=464;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=47;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=48;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,2)=49;
UPDATE `account` SET `is_asset`=FALSE WHERE LEFT(`account_number`,3)=466;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=5;
UPDATE `account` SET `is_asset`=NULL WHERE `parent`=0;


-- ADD 'po_box' field
-- Date: 2015-02-03
-- By: Chris LOMAME
ALTER TABLE `enterprise`
ADD `po_box` VARCHAR(30);


-- Add a new table partial_paiement
-- Date: 2015-02-06
-- By: Chris LOMAME
drop table if exists `partial_paiement`;
CREATE TABLE `partial_paiement` (
  `uuid`                    char(36) not null,
  `paiement_uuid`           char(36) not null,
  `currency_id`             tinyint unsigned,
  `paiement_date`           date,
  `amount`                  float default 0,
  primary key (`uuid`),
  key `paiement_uuid` (`paiement_uuid`),
  key `currency_id` (`currency_id`),
  constraint foreign key (`paiement_uuid`) references `paiement` (`uuid`),
  constraint foreign key (`currency_id`) references `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- Add a new table employee_invoice AND employee_invoice_item
-- Date: 2015-02-16
-- By: Chris LOMAME
drop table if exists `employee_invoice`;
CREATE TABLE `employee_invoice` (
  uuid            char(36) not null,
  project_id      smallint unsigned not null,
  debitor_uuid    char(36) not null,
  creditor_uuid   char(36) not null,
  note            text,
  authorized_by   varchar(80) not null,
  date            date not null,
  total           decimal(14, 4) not null default 0,
  primary key (`uuid`),
  key `debitor_uuid` (`debitor_uuid`),
  key `project_id` (`project_id`),
  key `creditor_uuid` (`creditor_uuid`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`creditor_uuid`) references `creditor` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `employee_invoice_item`;
CREATE TABLE `employee_invoice_item` (
  uuid              char(36) not null,
  payment_uuid        char(36) not null,
  invoice_uuid        char(36) not null,
  cost              decimal(16, 4) unsigned not null,
  primary key (`uuid`),
  key `payment_uuid` (`payment_uuid`),
  key `invoice_uuid` (`invoice_uuid`),
  constraint foreign key (`payment_uuid`) references `employee_invoice` (`uuid`) on delete cascade,
  constraint foreign key (`invoice_uuid`) references `sale` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


INSERT INTO `transaction_type` (`service_txt`) VALUES
('cotisation_engagement'), ('tax_engagement');

INSERT INTO `primary_cash_module` (`text`) VALUES
('cash_return');

USE bhima;

ALTER TABLE `depot`
ADD `is_warehouse` smallint unsigned not null default 0;


-- Removal of the column `fixed` and `locked` from the table account
-- Date: 2015-01-07
-- By: CHRIS LOMAME
-- ALTER TABLE `account`
-- DROP `fixed`;

-- Updates data base
--
-- Date: 2015-02-20
-- By: Chris LOMAME

USE bhima;

drop table if exists `consumption_reversing`;
create table `consumption_reversing` (
  `uuid`             char(36) not null,
  `consumption_uuid`        char(36) not null,
  `depot_uuid`       char(36) not null,
  `document_id`       char(36) not null,
  `date`             date,
  `tracking_number`  char(50) not null,
  `quantity`           int,
  `description`        text,
  primary key (`uuid`),
  key `consumption_uuid` (`consumption_uuid`),
  key `depot_uuid`   (`depot_uuid`),
  constraint foreign key (`consumption_uuid`) references `consumption` (`uuid`),
  constraint foreign key (`depot_uuid`) references `depot` (`uuid`) on delete cascade on update cascade
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

drop table if exists `hollyday_paiement`;
create table `hollyday_paiement` (
  `hollyday_id`             int unsigned not null,
  `hollyday_nbdays`         int unsigned not null,
  `hollyday_percentage`     float default 0,
  `paiement_uuid`           char(36) not null,
  constraint foreign key (`paiement_uuid`) references `paiement` (`uuid`),
  constraint foreign key (`hollyday_id`) references `hollyday` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Date: 2015-02-25
-- By: Chris LOMAME

USE bhima;


ALTER TABLE `account`
DROP `fixed`;-- Updates to account data

ALTER TABLE `consumption`
ADD `unit_price` float unsigned;-- written by lomamech

ALTER TABLE `purchase`
ADD `is_direct` boolean not null default 0;-- written by lomamech

ALTER TABLE `sale`
ADD `is_distributable` bit(1) not null default b'1';-- written by lomamech

ALTER TABLE `tax`
ADD `is_ipr` boolean;-- written by lomamech

INSERT INTO `transaction_type` (`id`, `service_txt`) VALUES
  (19,'cotisation_paiement'),
  (20,'generic_expense'),
  (21,'indirect_purchase'),
  (22, 'confirm_purchase'),
  (23, 'salary_advance'),
  (24, 'employee_invoice'),
  (25, 'pcash_employee'),
  (26, 'cash_discard'),
  (27, 'cash_return');

-- Update service text for transaction type
UPDATE `transaction_type` SET `service_txt` = 'pcash_convention' WHERE `transaction_type`.`id` = 8;

UPDATE `transaction_type` SET `service_txt` = 'pcash_transfert' WHERE `transaction_type`.`id` = 10;

UPDATE `transaction_type` SET `service_txt` = 'generic_income' WHERE `transaction_type`.`id` = 11;

-- Title : POPULATE LANGUAGE
-- By    : Bruce Mbayo
-- Date  : 04 mars 2015
INSERT INTO `language` (id, name, `key`) VALUES
  (1, 'Francais', 'fr'),
  (2, 'English', 'en'),
  (3, 'Lingala', 'lg');

-- Title : ALTER PURCHASE TABLE
-- By    : Bruce Mbayo
-- Date  : 04 mars 2015
ALTER TABLE `purchase`
ADD `is_donation` tinyint(1) NOT NULL DEFAULT '0',
MODIFY `creditor_uuid` char(36) NULL,
MODIFY `employee_id` int(10) unsigned NULL;

-- Title : ALTER CASH TABLE
-- By    : Bruce Mbayo
-- Date  : 18 mars 2015
ALTER TABLE  `cash`
ADD  `is_caution` TINYINT( 1 ) NOT NULL DEFAULT  '0';

INSERT INTO `unit` VALUES
(97,'Report Donation','TREE.REPORT_DONATION','Report donation', 10, 0, '/partials/reports/donation', '/reports/donation/');

-- Date: 2015-03-10
-- By: Chris LOMAME

INSERT INTO `transaction_type` (`service_txt`) VALUES
('reversing');

-- Updates to rubric structure
-- 
-- ADD 'is_advance' field
--
-- Date: 2015-03-25
-- By: Chris LOMAME


-- Title : ADD A PRIMARY CASH MODULE (with id=9 for payday_advance)
-- By    : Bruce Mbayo
-- Date  : 25 mars 2015
INSERT INTO `primary_cash_module` (`id`, `text`) VALUES
(9, 'payday_advance');


USE bhima;

ALTER TABLE `rubric`
ADD `is_advance` boolean;
-- INITIALISE ACCOUNT CLASS
-- Date 31 Mars 2015
-- By Bruce Mbayo
UPDATE `account` SET `classe`=1 WHERE LEFT(`account_number`,1)=1;
UPDATE `account` SET `classe`=2 WHERE LEFT(`account_number`,1)=2;
UPDATE `account` SET `classe`=3 WHERE LEFT(`account_number`,1)=3;
UPDATE `account` SET `classe`=4 WHERE LEFT(`account_number`,1)=4;
UPDATE `account` SET `classe`=5 WHERE LEFT(`account_number`,1)=5;
UPDATE `account` SET `classe`=6 WHERE LEFT(`account_number`,1)=6;
UPDATE `account` SET `classe`=7 WHERE LEFT(`account_number`,1)=7;
UPDATE `account` SET `classe`=8 WHERE LEFT(`account_number`,1)=8;
UPDATE `account` SET `classe`=9 WHERE LEFT(`account_number`,1)=9;

-- Title : ALTER PURCHASE TABLE
-- By    : Bruce Mbayo
-- Date  : 08 avr 2015
ALTER TABLE `purchase`
ADD `is_authorized` tinyint(1) NOT NULL DEFAULT '0',
ADD `is_validate` tinyint(1) NOT NULL DEFAULT '0';

INSERT INTO `unit` VALUES
(98,'Validation Purchase Order','TREE.VALIDATE_PURCHASE','',11,0,'/partials/purchase/validate/','purchase/validate/'),
(99,'Autorization Purchase Order','TREE.AUTHORIZE_PURCHASE','',11,0,'/partials/purchase/authorization/','/purchase/authorization/');