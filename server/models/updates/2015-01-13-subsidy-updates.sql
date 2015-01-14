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
