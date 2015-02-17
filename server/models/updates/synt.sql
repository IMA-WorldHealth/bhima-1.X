-- Updates to patient data
-- 
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
ADD `is_asset` BOOLEAN NULL-- written by jniles
-- Jan 7 2015

use bhima;

-- remove poorly labeled income accounts
update account as a JOIN account as b on a.id = b.id set a.account_type_id = 2 where b.account_type_id = 1;

-- set up income accounts as OHADA
update account as a JOIN account as b on a.id = b.id set a.account_type_id = 1 where b.account_type_id != 3 and b.account_number like '6%';
-- set up expense accounts as OHADA
update account as a JOIN account as b on a.id = b.id set a.account_type_id = 4 where b.account_type_id != 3 and b.account_number like '7%';
-- Updates to fiscal year data
---
-- DROP 'closing_account' field
--
-- Date: 2015-01-07
-- By: Jonathan Niles

USE bhima;

ALTER TABLE `fiscal_year`
DROP FOREIGN KEY `fiscal_year_ibfk_1`;

ALTER TABLE `fiscal_year`
DROP `closing_account`;
-- Updates to patient data
--
-- Add patient 'notes' field
--
-- Date: 2015-01-12
-- By: Jonathan Cameron

USE bhima;

ALTER TABLE `patient`
ADD `notes` text;
-- Update to units/menu
--
-- Add add menu/unit item for the budget menu item.
--
-- Date: 2015-01-13
-- By: Jonathan Cameron

USE bhima;

INSERT INTO `unit` VALUES
(7,'Edit Account Budget','TREE.EDIT_BUDGET','',8,0,'/partials/budget/edit/','/budgeting/edit');
-- Subsidy updating
--
-- CHANGE price_list_uuid, subsidy_uuid to be not requirement
-- ADD subsidy and sale_subsidy tables
--
-- Date: 2015-01-13
-- By: Dedrick Kitamuka

USE bhima;

drop table if exists `subsidy`;
create table `subsidy` (
  `uuid`                   char(36) not null,
  `text`                   text,
  `value`                  float default 0,
  `is_percent`             boolean,
  `debitor_group_uuid`     char(36) not null,
  primary key (`uuid`),
  key `debitor_group_uuid` (`debitor_group_uuid`),
  constraint foreign key (`debitor_group_uuid`) references `debitor_group` (`uuid`)
) engine=innodb;


ALTER TABLE `patient_group`
MODIFY `price_list_uuid` char(36) null;

ALTER TABLE `patient_group`
ADD `subsidy_uuid` char(36) null;

ALTER TABLE `patient_group`
ADD FOREIGN KEY (`subsidy_uuid`) references `subsidy` (`uuid`);

drop table if exists `sale_subsidy`;
create table `sale_subsidy` (
  `uuid`              char(36) not null,
  `sale_uuid`         char(36) not null,
  `subsidy_uuid`      char(36) not null,
  `value`             decimal(19,4) default '0',
  primary key (`uuid`),
  key `sale_uuid` (`sale_uuid`),
  key `subsidy_uuid` (`subsidy_uuid`),
  constraint foreign key (`sale_uuid`) references `sale` (`uuid`) on delete cascade,
  constraint foreign key (`subsidy_uuid`) references `subsidy` (`uuid`)
) engine=innodb;
-- Allow an employee lock
--
-- Date: 2015-01-26
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `employee`
ADD `locked` boolean;
-- Updates to accounts data
-- 
-- INSERT new parents class and UPDATE depending accounts
-- UPDATE is_asset (passive or active)
--
-- Date: 2015-01-29
-- By: Bruce Mbayo

use bhima;

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
(@ID_18, 3, 200, 18, 'PROVISIONS', 1, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 1),
(@ID_29, 3, 200, 29, 'IMMOBILISATIONS', 25, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 2),
(@ID_30, 3, 200, 30, 'STOCKS  MEDICAMENTS', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_32, 3, 200, 32, 'Emballages commerciaux', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_34, 3, 200, 34, 'Produits ophtalmologie', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_36, 3, 200, 36, 'SPROVISION POUR DEPRECIATION', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_35, 3, 200, 35, 'ACCOUCHEMENT', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_33, 3, 200, 33, 'EXTERNE', 89, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 3),
(@ID_46, 3, 200, 46, 'DEBITEURS ET CREDITEURS DIVERS', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_466, 3, 200, 466, 'AUTRES DEBITEURS ET CREDITEURS', @ID_46, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_48, 3, 200, 48, 'PROVISIONS POUR IMPAYES MALADES', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_49, 3, 200, 49, 'COMPTE D\'ATTENTE (ACTIF)', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_42, 3, 200, 42, 'MALADES HOSPITALISES', 184, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 4),
(@ID_5734, 3, 200, 5734, 'ROW', 490, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 5),
(@ID_5735, 3, 200, 5735, 'UNICEF', 490, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 5),
(@ID_61, 3, 200, 61, 'CONSOMMATIONS FOURNITURES', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_613, 3, 200, 613, 'MATERIELS ET EQUIPEMENTS', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_6131, 3, 200, 6131, 'Matériel et équipement administratif', @ID_613, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_616, 3, 200, 616, 'Consommable et matériel d\'entretien hospitalier', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_619, 3, 200, 619, 'AUTRES FOURNITURES', @ID_61, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_62, 3, 200, 62, 'TRANSPORT CONSOMME', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_628, 3, 200, 628, 'DIVERS FRAIS DE VOYAGE', @ID_62, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_6334, 3, 200, 6334, 'ROW', 660, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_68, 3, 200, 68, 'DOTATIONS', 535, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 6),
(@ID_70, 3, 200, 70, 'VENTE MEDICAMENTS', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_71, 3, 200, 71, 'ACTES/PRODUCTIONS VENDUES', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_72, 3, 200, 72, 'PRODUCTIONS STOCKEES', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_7615, 3, 200, 7615, 'DIVERS', 989, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_7614, 3, 200, 7614, 'ROW', 989, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7),
(@ID_78, 3, 200, 78, 'REPRISE SUBVENTION D\'EQUIPEMENT', 888, NULL, 0, NULL, NULL, '2014-07-10 08:13:00', 7);

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

UPDATE `account` SET `is_asset`=NULL WHERE `parent`=0;-- Updates to enterprise data
-- 
-- ADD 'po_box' field
--
-- Date: 2015-02-03
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `enterprise`
ADD `po_box` VARCHAR(30);
-- Add a new table partial_paiement
-- 
--
-- Date: 2015-02-06
-- By: Chris LOMAME

use bhima;

drop table if exists `partial_paiement`;
create table `partial_paiement` (
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
) engine=innodb;
-- Update to units/menu
--
-- Add add menu/unit item for the budget menu item.
--
-- Date: 2015-01-13
-- By: Jonathan Cameron

USE bhima;

INSERT INTO `transaction_type` (`service_txt`) VALUES
('cotisation_engagement'), ('tax_engagement');
