-- Updates to bhima database


-- Create table section_bilan.
-- Date: 2015-06-09
-- By: Chris LOMAME

USE bhima;
drop table if exists `section_bilan`;
CREATE TABLE `section_bilan` (
  `id`                  tinyint unsigned not null auto_increment,
  `text`                text,
  `is_actif`            boolean,
  `position`            int unsigned,
  primary key (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- Create section_resultat.
-- Date: 2015-06-09
-- By: Chris LOMAME
--
USE bhima;
drop table if exists `section_resultat`;
CREATE TABLE `section_resultat` (
  `id`                  tinyint unsigned not null auto_increment,
  `text`                text,
  `position`            int unsigned,
  `is_charge`           BOOLEAN not null,
  primary key (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



-- Create reference_group.
-- Date: 2015-06-09
-- By: Chris LOMAME
--
USE bhima;
drop table if exists `reference_group`;
CREATE TABLE `reference_group` (
  `id`                  tinyint unsigned not null auto_increment,
  `reference_group`     char(4) not null,
  `text`                text,
  `position`            int unsigned,
  `section_bilan_id`    tinyint unsigned,
  primary key (`id`),
  key `section_bilan_id` (`section_bilan_id`),
  constraint foreign key (`section_bilan_id`) references `section_bilan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Create table reference.
-- Date: 2015-06-24
-- By: Chris LOMAME

USE bhima;
drop table if exists `reference`;
CREATE TABLE `reference` (
  `id`                  tinyint unsigned not null auto_increment,
  `is_report`           boolean null,
  `ref`                 char(4) not null,
  `text`                text,
  `position`            int unsigned,
  `reference_group_id`  tinyint unsigned null,
  `section_resultat_id` tinyint unsigned null,
  primary key (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- Updates table account
-- Date: 2015-06-09
-- By: Chris LOMAME
-- ADD 'reference_id' field
-- ADD 'is_brut_link' field
--
USE bhima;
ALTER TABLE `account`
ADD `reference_id` tinyint unsigned;

USE bhima;
ALTER TABLE `account`
ADD `is_brut_link` boolean;

ALTER TABLE `account`
ADD FOREIGN KEY (`reference_id`) REFERENCES `reference` (`id`);

-- Updates table account
-- Date: 2015-06-10
-- By: Chris LOMAME
-- ADD Unit reference_group AND reference_group
--
INSERT INTO `unit` VALUES
('111','reference_group','TREE.REFERENCE_GROUP','Reference Group', 30, 0, '/partials/reference_group', '/reference_group/'),
('112','reference','TREE.REFERENCE','Reference', 30, 0, '/partials/reference', '/reference/');
-- Adding record into unit table
-- Date: 2015-06-10
-- By: Dedrick kitamuka
--

INSERT INTO `unit` VALUES
(109, 'Section du bilan', 'TREE.SECTION_BILAN', '', 30, 0, '/partials/section_bilan/', '/section_bilan/');


-- Adding record into unit table
-- Date: 2015-06-10
-- By: Dedrick kitamuka
--

INSERT INTO `unit` VALUES
(110, 'Section resultat', 'TREE.SECTION_RESULTAT', '', 30, 0, '/partials/section_resultat/', '/section_resultat/');


-- Updates table account
-- Date: 2015-06-18
-- By: Chris LOMAME
-- ADD 'is_used_budget' field
--
USE bhima;
ALTER TABLE `account`
ADD `is_used_budget` boolean NOT NULL;

-- Update purchase table
-- Date : 2015-06-29
-- By : Dedrick Kitamuka

USE bhima;

ALTER TABLE `purchase`
DROP FOREIGN KEY `purchase_ibfk_3`;

ALTER TABLE `purchase` DROP `header_id`;
ALTER TABLE `purchase` DROP `purchaser_id`;
ALTER TABLE `purchase` DROP `employee_id`;

ALTER TABLE `purchase` ADD `purchaser_id` int(10) unsigned NULL;
ALTER TABLE `purchase` ADD `receiver_id` int(10) unsigned NULL;
ALTER TABLE `purchase` CHANGE `issuer_id` `emitter_id` smallint(5) unsigned NOT NULL;

ALTER TABLE `purchase` ADD CONSTRAINT FOREIGN KEY (`receiver_id`) REFERENCES `employee`(`id`);



-- Updates table account
-- Date: 2015-06-09
-- By: Chris LOMAME
-- ADD Report Stock integration
--
INSERT INTO `unit` VALUES
('113','Report Stock Integration','TREE.REPORT_STOCK_INTEGRATION','',10,0,'/partials/reports/stock_integration/','reports/stock_integration/');






