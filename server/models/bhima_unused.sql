-- This file contains unused sql tables from bhima.sql

--
-- Table structure for table `bhima`.`tax`
--
drop table if exists `tax`;
create table `tax` (
  `id`            smallint unsigned not null auto_increment,
  `registration`  mediumint unsigned not null,
  `note`          text,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `bhima`.`price_group`
--
drop table if exists `price_group`;
create table `price_group` (
  `id`    smallint unsigned not null,
  `text`  varchar(100) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `bhima`.`account_category`
drop table if exists `account_category`;
create table `account_category` (
  `id`        tinyint not null,
  `title`     varchar(120) not null,
  `collection_id` tinyint not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `bhima`.`account_collection`
--
drop table if exists `account_collection`;
create table `account_collection` (
  `id`               tinyint not null,
  `leading_number`   tinyint not null,
  `title`            varchar(120) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `bhima`.`department`
--
drop table if exists `department`;
create table `department` (
  `enterprise_id` smallint unsigned not null,
  `id`            smallint unsigned not null,
  `name`          varchar(100) not null,
  `note`          text,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `bhima`.`employee`
--
drop table if exists `employee`;
create table `employee` (
  `id`            smallint unsigned not null,
  `name`          varchar(50) not null,
  `title`         varchar(50),
  `debitor_id`    int unsigned not null,
  `creditor_id`   int unsigned not null,
  `location_id`   smallint unsigned not null,
  `department_id` smallint unsigned not null,
  `initials`      varchar(3) not null,
  primary key (`id`),
  key `debitor_id` (`debitor_id`),
  key `location_id` (`location_id`),
  key `department_id` (`department_id`),
  key `creditor_id` (`creditor_id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`) on delete cascade on update cascade,
  constraint foreign key (`location_id`) references `location` (`id`) on delete cascade on update cascade,
  constraint foreign key (`creditor_id`) references `creditor` (`id`) on delete cascade on update cascade,
  constraint foreign key (`department_id`) references `department` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- table `bhima`.`account_group`
--
-- TODO: when we can discuss this as a group
-- drop table if exists `account_group`;
-- create table `account_group` (
--   `id`              int not null auto_increment,
--   `account_id`      int not null,
--   `enterprise_id`   smallint not null,
--   primary key (`id`),
--   key (`account_id`),
--   key (`enterprise_id`),
--   constraint foreign key (`account_id`) references `account` (`id`),
--   constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
-- ) engine=innodb;

-- TODO Reference user table
drop table if exists `journal_log`;
create table `journal_log` (
  `id`              int unsigned not null auto_increment,
  `transaction_id`  int unsigned not null,
  `note`            text,
  `date`            date not null,
  `user_id`         smallint unsigned not null,
  primary key (`id`)
) engine=innodb;
