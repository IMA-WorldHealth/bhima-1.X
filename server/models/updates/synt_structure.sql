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


ALTER TABLE `account`
ADD FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`);



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
) engine=innodb;

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
) engine=innodb;


-- Allow an employee lock
-- Date: 2015-01-26
-- By: Chris LOMAME
ALTER TABLE `employee`
ADD `locked` boolean;

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
) engine=innodb;


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
) engine=innodb;

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
) engine=innodb;

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
) engine=innodb;

drop table if exists `hollyday_paiement`;
create table `hollyday_paiement` (
  `hollyday_id`             int unsigned not null,
  `hollyday_nbdays`         int unsigned not null,
  `hollyday_percentage`     float default 0,
  `paiement_uuid`           char(36) not null,
  constraint foreign key (`paiement_uuid`) references `paiement` (`uuid`),
  constraint foreign key (`hollyday_id`) references `hollyday` (`id`)
) engine=innodb;

