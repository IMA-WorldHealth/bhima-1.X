drop database if exists`kpk`;
create database `kpk`;
use `kpk`;

grant all on `kpk`.* to 'kpk'@'%' identified by 'HISCongo2013';
grant super on *.* to 'kpk'@'%';
flush privileges;

--
-- Table structure for table `kpk`.`currency`
--
drop table if exists `currency`;
create table `currency` (
  `id`                  tinyint unsigned not null auto_increment,
  `name`                text not null,
  `symbol`              varchar(15) not null,
  `note`                text,
  `separator`           varchar(5),
  `decimal`             varchar(5),
  `min_monentary_unit`  decimal(10, 2) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`exchange_rate`
--
drop table if exists `exchange_rate`;
create table `exchange_rate` (
  `id`                      mediumint unsigned not null auto_increment,
  `enterprise_currency_id`  tinyint unsigned not null,
  `foreign_currency_id`     tinyint unsigned not null,
  `rate`                    decimal(19, 4) unsigned not null,
  `date`                    date not null,
  key `enterprise_currency_id` (`enterprise_currency_id`),
  key `foreign_currency_id` (`foreign_currency_id`),
  primary key (`id`),
  constraint foreign key (`enterprise_currency_id`) references `currency` (`id`),
  constraint foreign key (`foreign_currency_id`) references `currency` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`user`
--
drop table if exists `user`;
create table `user` (
  `id`        smallint unsigned not null auto_increment,
  `username`  varchar(80) not null,
  `password`  varchar(100) not null,
  `first`     text not null,
  `last`      text not null,
  `email`     varchar(100),
  `logged_in` boolean not null default 0,
  `pin`       char(4) not null default 0,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`unit`
--
drop table if exists `unit`;
create table `unit` (
  `id`            smallint unsigned not null,
  `name`          varchar(30) not null,
  `key`           varchar(70) not null,
  `description`   text not null,
  `parent`        smallint default 0,
  `has_children`  boolean not null default 0,
  `url`           tinytext,
  `path`          tinytext,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`permission`
--
drop table if exists `permission`;
create table `permission` (
  `id`        mediumint unsigned not null auto_increment,
  `unit_id`   smallint unsigned not null,
  `user_id`   smallint unsigned not null,
  primary key (`id`),
  key `unit_id` (`unit_id`),
  key `user_id` (`user_id`),
  constraint foreign key (`unit_id`) references `unit` (`id`) on delete cascade on update cascade,
  constraint foreign key (`user_id`) references `user` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`country`
--
drop table if exists `country`;
create table `country` (
  `uuid`        char(36) not null,
  `code`        smallint unsigned not null,
  `country_en`  varchar(45) not null,
  `country_fr`  varchar(45) not null,
  primary key (`uuid`),
  unique key `code_unique` (`code`)
) engine=innodb;

--
-- Table structure for table `province`;
--
drop table if exists `province`;
create table `province` (
  `uuid`       char(36) not null,
  `name`       text,
  `country_uuid` char(36) not null,
  primary key (`uuid`),
  key `country_uuid` (`country_uuid`),
  constraint foreign key (`country_uuid`) references `country` (`uuid`)
) engine=innodb;

--
-- Table structure for table `sector`;
--
drop table if exists `sector`;
create table `sector` (
  `uuid`        char(36) not null,
  `name`        text,
  `province_uuid` char(36) not null,
  primary key (`uuid`),
  key `province_id` (`province_uuid`),
  constraint foreign key (`province_uuid`) references `province` (`uuid`)
) engine=innodb;

--
-- Table structure for table `village`;
--
drop table if exists `village`;
create table `village` (
  `uuid`        char(36) not null,
  `name`        text,
  `sector_uuid` char(36) not null,
  primary key (`uuid`),
  key `sector_id` (`sector_uuid`),
  constraint foreign key (`sector_uuid`) references `sector` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`enterprise`
--
drop table if exists `enterprise`;
create table `enterprise` (
  `id`                  smallint unsigned not null auto_increment,
  `name`                text not null,
  `abbr`                varchar(50),
  `phone`               varchar(20),
  `email`               varchar(70),
  `location_id`         char(36),
  `logo`                varchar(70),
  `currency_id`         tinyint unsigned not null,
  primary key (`id`),
  key `location_id` (`location_id`),
  key `currency_id` (`currency_id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`location_id`) references `village` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`project`
--
drop table if exists `project`;
create table `project` (
  `id`              smallint unsigned not null auto_increment,
  `name`            text,
  `abbr`            char(3) UNIQUE,
  `enterprise_id`   smallint unsigned not null,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;

--
-- Table structure for `kpk`.`project_permission`
--
drop table if exists `project_permission`;
create table `project_permission` (
  `id`            smallint unsigned not null auto_increment,
  `user_id`       smallint unsigned not null,
  `project_id`    smallint unsigned not null,
  primary key (`id`),
  key `user_id` (`user_id`),
  key `project_id` (`project_id`),
  constraint foreign key (`project_id`) references `project` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`fiscal_year`
--
drop table if exists `fiscal_year`;
create table `fiscal_year` (
  `enterprise_id`             smallint unsigned not null,
  `id`                        mediumint unsigned not null auto_increment,
  `number_of_months`          mediumint unsigned not null,
  `fiscal_year_txt`           text not null,
  `transaction_start_number`  int unsigned,
  `transaction_stop_number`   int unsigned,
  `fiscal_year_number`        mediumint unsigned,
  `start_month`               int unsigned not null,
  `start_year`                int unsigned not null,
  `previous_fiscal_year`      mediumint unsigned,
  `locked`                    boolean not null default 0,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`budget`
--
drop table if exists `budget`;
create table `budget` (
  `id` int not null auto_increment,
  `account_id` int unsigned not null default '0',
  `period_id` mediumint unsigned not null,
  `budget` decimal(10,4) unsigned,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`critere`
--
drop table if exists `critere`;
create table `critere` (
  `id`            smallint unsigned not null auto_increment,
  `critere_txt`  varchar(50) not null,
  `note`          text,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`account_type`
--
drop table if exists `account_type`;
create table `account_type` (
  `id` mediumint unsigned not null,
  `type` varchar(35) not null,
  primary key (`id`)
) engine=innodb;

--
-- table `kpk`.`pricipal_center`
--
drop table if exists `cost_center`;
create table `cost_center` (
  `enterprise_id`   smallint unsigned not null,
  `id`              smallint not null auto_increment,
  `text`            varchar(100) not null,
  `cost`            float default 0,
  `note`            text,
  `pc`              boolean default 0,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on delete cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`account`
--
DROP TABLE IF EXISTS `account`;
create table `account` (
  `id`                  int unsigned not null auto_increment,
  `account_type_id`     mediumint unsigned not null,
  `enterprise_id`       smallint unsigned not null,
  `account_number`      int not null,
  `account_txt`         text,
  `parent`              int unsigned not null,
  `fixed`               boolean default 0,
  `locked`              tinyint unsigned default 0,
  `cc_id`               smallint default -1,
  primary key (`id`),
  key `account_type_id` (`account_type_id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`account_type_id`) references `account_type` (`id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`creditor_group`
--
drop table if exists `creditor_group`;
create table `creditor_group` (
  `enterprise_id` smallint unsigned not null,
  `uuid`          char(36) not null,
  `name`          varchar(80),
  `account_id`    int unsigned not null,
  `locked`        boolean not null default 0,
  primary key (`uuid`),
  key `account_id` (`account_id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on delete cascade on update cascade,
  constraint foreign key (`account_id`) references `account` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`creditor`
--
drop table if exists `creditor`;
create table `creditor` (
  `uuid`        char(36) not null,
  `group_uuid`  char(36) not null,
  `text`        varchar(45),
  primary key (`uuid`),
  key `group_uuid` (`group_uuid`),
  constraint foreign key (`group_uuid`) references `creditor_group` (`uuid`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`payment`
--

drop table if exists `payment`;
create table `payment` (
  `id`      tinyint unsigned not null auto_increment,
  `days`    smallint unsigned default '0',
  `months`  mediumint unsigned default '0',
  `text`    varchar(50) not null,
  `note`    text,
  primary key (`id`)
) engine=innodb;

drop table if exists `cash_box`;
create table `cash_box` (
  `id`              mediumint unsigned not null auto_increment,
  `text`            text not null,
  `project_id`      smallint unsigned not null,
  `is_auxillary`    boolean not null,
  primary key (`id`),
  key `project_id` (`project_id`),
  constraint foreign key (`project_id`) references `project` (`id`)
) engine=innodb;

drop table if exists `cash_box_account_currency`;
create table `cash_box_account_currency` (
  `id`              mediumint unsigned not null auto_increment,
  `currency_id`     tinyint unsigned not null,
  `cash_box_id`     mediumint unsigned not null,
  `account_id`      int unsigned,
  primary key (`id`),
  key `currency_id` (`currency_id`),
  key `cash_box_id` (`cash_box_id`),
  key `account_id` (`account_id`),
  -- unique key (`id`, `currency_id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`cash_box_id`) references `cash_box` (`id`),
  constraint foreign key (`account_id`) references `account` (`id`)
) engine=innodb;

drop table if exists `caution_box`;
create table `caution_box` (
  `id`              mediumint unsigned not null auto_increment,
  `text`            text not null,
  `project_id`      smallint unsigned not null,
  primary key (`id`),
  key `project_id` (`project_id`),
  constraint foreign key (`project_id`) references `project` (`id`)
) engine=innodb;

drop table if exists `caution_box_account_currency`;
create table `caution_box_account_currency` (
  `id`              mediumint unsigned not null auto_increment,
  `currency_id`     tinyint unsigned not null,
  `caution_box_id`     mediumint unsigned not null,
  `account_id`    int unsigned,
  primary key (`id`),
  key `currency_id` (`currency_id`),
  key `caution_box_id` (`caution_box_id`),
  key `account_id` (`account_id`),
  -- unique key (`id`, `currency_id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`caution_box_id`) references `caution_box` (`id`),
  constraint foreign key (`account_id`) references `account` (`id`)
) engine=innodb;

--
-- Currency account is deprecated (replaced with cash box relationship)
--
-- drop table if exists `currency_account`;
-- create table `currency_account` (
--   `id`              mediumint unsigned not null auto_increment,
--   `currency_id`     tinyint unsigned not null,
--   `enterprise_id`   smallint unsigned not null,
--   `cash_account`    int unsigned not null,
--   `bank_account`    int unsigned not null,
--   primary key (`id`),
--   key `currency_id` (`currency_id`),
--   key `enterprise_id` (`enterprise_id`),
--   key `cash_account` (`cash_account`),
--   key `bank_account` (`bank_account`),
--   unique key (`id`, `currency_id`),
--   constraint foreign key (`currency_id`) references `currency` (`id`),
--   constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
--   constraint foreign key (`cash_account`) references `account` (`id`),
--   constraint foreign key (`bank_account`) references `account` (`id`)
-- ) engine=innodb;
--

--
-- Table structure for table `kpk`.`inventory_unit`
--
drop table if exists `inventory_unit`;
create table `inventory_unit` (
  `id`    smallint unsigned not null auto_increment,
  `text`  varchar(100) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`period`
--
drop table if exists `period`;
create table `period` (
  `id`              mediumint unsigned not null auto_increment,
  `fiscal_year_id`  mediumint unsigned not null,
  `period_number`   smallint unsigned not null,
  `period_start`    date not null,
  `period_stop`     date not null,
  `locked`          boolean not null default 0,
  primary key (`id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inventory_type`
--
drop table if exists `inventory_type`;
create table `inventory_type` (
  `id`    tinyint unsigned not null,
  `text`  varchar(150) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inventory_group`
--
drop table if exists `inventory_group`;
create table `inventory_group` (
  `uuid`            char(36) not null,
  `name`            varchar(100) not null,
  `code`            smallint not null,
  `sales_account`   mediumint unsigned not null,
  `cogs_account`    mediumint unsigned,
  `stock_account`   mediumint unsigned,
  `tax_account`     mediumint unsigned,
  primary key (`uuid`)
  -- key `sales_account` (`sales_account`),
  -- key `cogs_account` (`cogs_account`),
  -- key `stock_account` (`stock_account`),
  -- key `tax_account` (`tax_account`),
  -- constraint foreign key (`sales_account`) references `account` (`account_number`),
  -- constraint foreign key (`cogs_account`) references `account` (`account_number`),
  -- constraint foreign key (`stock_account`) references `account` (`account_number`),
  -- constraint foreign key (`tax_account`) references `account` (`account_number`)
) engine=innodb;

-- TODO User responsible for inventory item should be added
--
-- Table structure for table `kpk`.`inventory`
--
drop table if exists `inventory`;
create table `inventory` (
  `enterprise_id`   smallint unsigned not null,
  `uuid`            char(36) not null,
  `code`            varchar(30) not null,
  `inventory_code`  varchar(30),
  `text`            text,
  `price`           decimal(10,4) unsigned not null default '0.00',
  `group_uuid`      char(36) not null,
  `unit_id`         smallint unsigned,
  `unit_weight`     mediumint default '0',
  `unit_volume`     mediumint default '0',
  `stock`           int unsigned not null default '0',
  `stock_max`       int unsigned not null default '0',
  `stock_min`       int unsigned not null default '0',
  `type_id`         tinyint unsigned not null default '0',
  `consumable`      boolean not null default 0,
  `origin_stamp`    timestamp null default CURRENT_TIMESTAMP,
  primary key (`uuid`),
  unique key `code` (`code`),
  key `enterprise_id` (`enterprise_id`),
  key `group_uuid` (`group_uuid`),
  key `unit_id` (`unit_id`),
  key `type_id` (`type_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`group_uuid`) references `inventory_group` (`uuid`),
  constraint foreign key (`unit_id`) references `inventory_unit` (`id`),
  constraint foreign key (`type_id`) references `inventory_type` (`id`)
) engine=innodb;
--
-- table `kpk`.`price_list`
--
drop table if exists `price_list`;
create table `price_list` (
  enterprise_id   smallint unsigned not null,
  uuid            char(36) not null,
  title           text,
  description     text,
  primary key (`uuid`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;


--
-- table `kpk`.`price_list_item`
--
drop table if exists `price_list_item`;
create table `price_list_item` (
  `uuid`            char(36) not null,
  `item_order`      int unsigned not null,
  `description`     text,
  `value`           float not null,
  `is_discount`     boolean not null default 0,
  `is_global`       boolean not null default 0, -- TODO names should better describe values
  `price_list_uuid` char(36) not null,
  `inventory_uuid`  char(36),
  primary key (`uuid`),
  -- unique index (`item_order`, `price_list_uuid`),
  key `price_list_uuid` (`price_list_uuid`),
  key `inventory_uuid` (`inventory_uuid`),
  constraint foreign key (`price_list_uuid`) references `price_list` (`uuid`) on delete cascade,
  constraint foreign key (`inventory_uuid`) references `inventory` (`uuid`) on delete cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor_group_type`
--
-- drop table if exists `debitor_group_type`;
-- create table `debitor_group_type` (
--   `id` smallint unsigned not null auto_increment,
--   `type` varchar(80) not null,
--   primary key (`id`)
-- ) engine=innodb;
--

--
-- Table structure for table `kpk`.`debitor_group`
--
drop table if exists `debitor_group`;
create table `debitor_group` (
  `enterprise_id`       smallint unsigned not null,
  `uuid`                char(36) not null,
  `name`                varchar(100) not null,
  `account_id`          int unsigned not null,
  `location_id`         char(36) not null,
  `payment_id`          tinyint unsigned not null default '3',
  `phone`               varchar(10) default '',
  `email`               varchar(30) default '',
  `note`                text,
  `locked`              boolean not null default 0,
  `tax_id`              smallint unsigned null,
  `max_credit`          mediumint unsigned default '0',
  -- `type_id`             smallint unsigned,
  `is_convention`        boolean not null default 0,
  `price_list_uuid`      char(36) null,
  primary key (`uuid`),
  key `enterprise_id` (`enterprise_id`),
  key `account_id` (`account_id`),
  key `location_id` (`location_id`),
  key `price_list_uuid` (`price_list_uuid`),
--  key `tax_id` (`tax_id`),
  -- key `type_id` (`type_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on delete cascade on update cascade,
  constraint foreign key (`account_id`) references `account` (`id`) on delete cascade on update cascade,
  constraint foreign key (`location_id`) references `village` (`uuid`) on delete cascade on update cascade,
  constraint foreign key (`price_list_uuid`) references `price_list` (`uuid`) on delete cascade on update cascade
--  constraint foreign key (`tax_id`) references `tax` (`id`),
  -- constraint foreign key (`type_id`) references `debitor_group_type` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`patient_group`
--
drop table if exists `patient_group`;
create table `patient_group` (
  enterprise_id     smallint unsigned not null,
  uuid              char(36) not null,
  price_list_uuid   char(36) not null,
  name              varchar(60) not null,
  note              text,
  primary key (`uuid`),
  key `enterprise_id` (`enterprise_id`),
  key `price_list_uuid` (`price_list_uuid`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`price_list_uuid`) references `price_list` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor`
--
drop table if exists `debitor`;
create table `debitor` (
  `uuid`          char(36) not null,
  `group_uuid`    char(36) not null,
  `text`      text,
  primary key (`uuid`),
  key `group_uuid` (`group_uuid`),
  constraint foreign key (`group_uuid`) references `debitor_group` (`uuid`) on delete cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`supplier`
--
drop table if exists `supplier`;
create table `supplier` (
  `uuid`            char(36),
  `creditor_uuid`   char(36) not null,
  `name`            varchar(45) not null,
  `address_1`       text,
  `address_2`       text,
  `location_id`     char(36) not null,
  `email`           varchar(45),
  `fax`             varchar(45),
  `note`            varchar(50),
  `phone`           varchar(15),
  `international`   boolean not null default 0,
  `locked`          boolean not null default 0,
  primary key (`uuid`),
  key `creditor_uuid` (`creditor_uuid`),
  key `location_id` (`location_id`),
  constraint foreign key (`location_id`) references `village` (`uuid`) on delete cascade on update cascade,
  constraint foreign key (`creditor_uuid`) references `creditor` (`uuid`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`patient`
--
drop table if exists `patient`;
create table `patient` (
  `uuid`              char(36) not null,
  `project_id`        smallint unsigned not null,
  `reference`         int unsigned not null, -- human readable id
  `debitor_uuid`      char(36) not null,
  `creditor_uuid`     char(36) null, -- anticipating uuids for creditors
  `first_name`        varchar(150) not null,
  `last_name`         varchar(150) not null,
  `dob`               date,
  `father_name`       varchar(150),
  `mother_name`       varchar(150),
  `profession`        varchar(150),
  `employer`          varchar(150),
  `spouse`            varchar(150),
  `spouse_profession` varchar(150),
  `spouse_employer`   varchar(150),
  `sex`               char(1) not null,
  `religion`          varchar(50),
  `marital_status`    varchar(50),
  `phone`             varchar(12),
  `email`             varchar(20),
  `addr_1`            varchar(100),
  `addr_2`            varchar(100),
  `renewal`           boolean not null default 0,
  `origin_location_id`        char(36) not null,
  `current_location_id`       char(36) not null,
  `registration_date`         timestamp null default CURRENT_TIMESTAMP,
  primary key (`uuid`),
  key `reference` (`reference`),
  key `project_id` (`project_id`),
  key `debitor_uuid` (`debitor_uuid`),
  key `origin_location_id` (`origin_location_id`),
  key `current_location_id` (`current_location_id`),
  unique key `creditor_uuid` (`creditor_uuid`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`) on update cascade on delete cascade,
  constraint foreign key (`current_location_id`) references `village` (`uuid`) on update cascade,
  constraint foreign key (`origin_location_id`) references `village` (`uuid`) on update cascade
) engine=innodb;

-- create trigger `patient_reference`
--   before insert on `patient`
--   for each row
--   set new.reference = (select IF(ISNULL(max(reference)), 1, max(reference) + 1) from patient where project_id = new.project_id);

--
-- Table structure for table `kpk`.`patient_visit`
--
drop table if exists `patient_visit`;
create table `patient_visit` (
  `uuid`                  char(36) not null,
  `patient_uuid`          char(36) not null,
  `date`                  timestamp not null,
  `registered_by`         smallint unsigned not null,
  primary key (`uuid`),
  key `patient_uuid` (`patient_uuid`),
  key `registered_by` (`registered_by`),
  constraint foreign key (`patient_uuid`) references `patient` (`uuid`) on delete cascade on update cascade,
  constraint foreign key (`registered_by`) references `user` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor`
--
drop table if exists `assignation_patient`;
create table `assignation_patient` (
  `uuid`                char(36) not null,
  `patient_group_uuid`  char(36) not null,
  `patient_uuid`        char(36) not null,
  primary key (`uuid`),
  key `patient_group_uuid` (`patient_group_uuid`),
  key `patient_uuid` (`patient_uuid`),
  constraint foreign key (`patient_group_uuid`) references `patient_group` (`uuid`) on delete cascade on update cascade,
  constraint foreign key (`patient_uuid`) references `patient` (`uuid`) on delete cascade on update cascade
) engine=innodb;



--
-- Table structure for table `kpk`.`sale`
--
drop table if exists `sale`;
create table `sale` (
  `project_id`    smallint unsigned not null,
  `reference`     int unsigned not null,
  `uuid`          char(36) not null,
  `cost`          decimal(19,4) unsigned not null,
  `currency_id`   tinyint unsigned not null,
  `debitor_uuid`  char(36) not null,
  `seller_id`     smallint unsigned not null default 0,
  `discount`      mediumint unsigned default '0',
  `invoice_date`  date not null, -- is this the date of the sale?
  `note`          text,
  `posted`        boolean not null default '0',
  `timestamp`     timestamp default current_timestamp,
  primary key (`uuid`),
  key `reference` (`reference`),
  key `project_id` (`project_id`),
  key `debitor_uuid` (`debitor_uuid`),
  key `currency_id` (`currency_id`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`),
  constraint foreign key (`currency_id`) references `currency` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`credit_note`
--
drop table if exists `credit_note`;
create table `credit_note` (
  `project_id`    smallint unsigned not null,
  `reference`     int unsigned not null,
  `uuid`          char(36) not null,
  `cost`          decimal(19,4) unsigned not null,
  `debitor_uuid`  char(36) not null,
  `seller_id`     smallint unsigned not null default 0,
  `sale_uuid`     char(36) not null,
  `note_date`     date not null,
  `description`   text,
  `posted`        boolean not null default 0,
  primary key (`uuid`),
  key `reference` (`reference`),
  key `project_id` (`project_id`),
  key `debitor_uuid` (`debitor_uuid`),
  key `sale_uuid` (`sale_uuid`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`),
  constraint foreign key (`sale_uuid`) references `sale` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`sale_item`
--
drop table if exists `sale_item`;
create table `sale_item` (
  `sale_uuid`         char(36) not null,
  `uuid`              char(36) not null,
  `inventory_uuid`    char(36) not null,
  `quantity`          int unsigned default '0',
  `inventory_price`   decimal(19,4),
  `transaction_price` decimal(19,4) not null,
  `debit`             decimal(19,4) not null default 0,
  `credit`            decimal(19,4) not null default 0,
  -- `unit_price`    decimal(19, 2) unsigned not null,
  -- `total`         decimal(19, 2) unsigned,
  primary key (`uuid`),
  key `sale_uuid` (`sale_uuid`),
  key `inventory_uuid` (`inventory_uuid`),
  constraint foreign key (`sale_uuid`) references `sale` (`uuid`) on delete cascade,
  constraint foreign key (`inventory_uuid`) references `inventory` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`purchase`
--
drop table if exists `purchase`;
create table `purchase` (
  `project_id`        smallint unsigned not null,
  `reference`         int unsigned not null auto_increment,
  `uuid`              char(36) not null,
  `cost`              decimal(19,4) unsigned not null default '0',
  `currency_id`       tinyint unsigned not null,
  `creditor_uuid`     char(36) not null,
  `purchaser_id`      smallint unsigned not null,
  `employee_id`       int unsigned not null,
  `discount`          mediumint unsigned default '0',
  `purchase_date`     date not null,
  `timestamp`         timestamp null default CURRENT_TIMESTAMP,
  `note`              text,
  `posted`            boolean not null default 1,
  primary key (`uuid`),
  key `project_id` (`project_id`),
  key `reference` (`reference`),
  key `creditor_uuid` (`creditor_uuid`),
  key `purchaser_id` (`purchaser_id`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`creditor_uuid`) references `creditor` (`uuid`),
  constraint foreign key (`purchaser_id`) references `user` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inventory_detail`
--
drop table if exists `inventory_detail`;
create table `inventory_detail` (
  `uuid`              char(36) not null,
  `inventory_uuid`    char(36) not null,
  `serial_number`     text,
  `lot_number`        text,
  `delivery_date`     date,
  `po_uuid`           char(36) not null,
  `expiration_date`   date,
  primary key (`uuid`),
  key `inventory_uuid` (`inventory_uuid`),
  key `po_uuid` (`po_uuid`),
  constraint foreign key (`inventory_uuid`) references `inventory` (`uuid`),
  constraint foreign key (`po_uuid`) references `purchase` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`purchase_item`
--
drop table if exists `purchase_item`;
create table `purchase_item` (
  `purchase_uuid`     char(36) not null,
  `uuid`              char(36) not null,
  `inventory_uuid`  char(36) not null,
  `quantity`        int unsigned default '0',
  `unit_price`      decimal(10,4) unsigned not null,
  `total`           decimal(10,4) unsigned,
  primary key (`uuid`),
  key `purchase_uuid` (`purchase_uuid`),
  key `inventory_uuid` (`inventory_uuid`),
  constraint foreign key (`purchase_uuid`) references `purchase` (`uuid`) on delete cascade,
  constraint foreign key (`inventory_uuid`) references `inventory` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`transaction_type`
--
drop table if exists `transaction_type`;
create table `transaction_type` (
  `id`            tinyint unsigned not null auto_increment,
  `service_txt`   varchar(45) not null,
  primary key (`id`)
) engine=innodb;


--
-- Table structure for table `kpk`.`cash`
--
drop table if exists `cash`;
create table `cash` (
  `project_id`      smallint unsigned not null,
  `reference`       int unsigned not null,
  `uuid`            char(36) not null,
  `document_id`     int unsigned not null,
  `type`            char(1) not null,
  `date`            date not null,
  `debit_account`   int unsigned not null,
  `credit_account`  int unsigned not null,
  `deb_cred_uuid`   char(36) not null,
  `deb_cred_type`   varchar(1) not null,
  `currency_id`     tinyint unsigned not null,
  `cost`            decimal(19,4) unsigned not null default 0,
  `user_id`         smallint unsigned not null,
  `cashbox_id`      smallint unsigned not null,
  `description`     text,
  primary key (`uuid`),
  -- unique key (`document_id`, `type`),
  key `reference` (`reference`),
  key `project_id` (`project_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  key `debit_account` (`debit_account`),
  key `credit_account` (`credit_account`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`user_id`) references `user` (`id`),
  constraint foreign key (`debit_account`) references `account` (`id`),
  constraint foreign key (`credit_account`) references `account` (`id`)
) engine=innodb;

--
-- table `kpk`.`cash_item`
--
drop table if exists `cash_item`;
create table `cash_item` (
  `uuid`              char(36) not null,
  `cash_uuid`         char(36) not null,
  `allocated_cost`    decimal(19,4) unsigned not null default 0.00,
  `invoice_uuid`      char(36),
  primary key (`uuid`),
  key `cash_uuid` (`cash_uuid`),
--  key `invoice_uuid` (`invoice_uuid`),
  constraint foreign key (`cash_uuid`) references `cash` (`uuid`)
--  constraint foreign key (`invoice_uuid`) references `sale` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`posting_session`
--
-- TODO : number of records posted
drop table if exists `posting_session`;
create table `posting_session` (
  `id`        int unsigned not null auto_increment,
  `user_id`   smallint unsigned not null,
  `date`      timestamp not null,
  primary key (`id`),
  key `user_id` (`user_id`),
  constraint foreign key (`user_id`) references `user` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`posting_journal`
--
drop table if exists `posting_journal`;
create table `posting_journal` (
  `uuid`              char(36) not null,
  `project_id`        smallint unsigned not null,
  `fiscal_year_id`    mediumint unsigned, -- not null,
  `period_id`         mediumint unsigned, -- not null,
  `trans_id`          text not null,
  `trans_date`        date not null,
  `doc_num`           int unsigned, -- what does this do? -- why would this be not null if we don't know what it does? -- as a reminder to ask dedrick...
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             decimal (19, 4) unsigned not null default 0,
  `credit`            decimal (19, 4) unsigned not null default 0,
  `debit_equiv`       decimal (19, 4) unsigned not null default 0,
  `credit_equiv`      decimal (19, 4) unsigned not null default 0,
  `currency_id`       tinyint unsigned not null,
  `deb_cred_uuid`     char(36), -- debitor or creditor id
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         char(36),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned not null,
  `user_id`           smallint unsigned not null,
  primary key (`uuid`),
  key `project_id` (`project_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `period_id` (`period_id`),
  key `origin_id` (`origin_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  constraint foreign key (`origin_id`) references `transaction_type` (`id`) on update cascade,
  constraint foreign key (`project_id`) references `project` (`id`) on update cascade,
  constraint foreign key (`currency_id`) references `currency` (`id`) on update cascade,
  constraint foreign key (`user_id`) references `user` (`id`) on update cascade
) engine=innodb;

--
-- table `kpk`.`general_ledger`
--
drop table if exists `general_ledger`;
create table `general_ledger` (
  `uuid`              char(36) not null,
  `project_id`        smallint unsigned not null,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `trans_id`          text not null,
  `trans_date`        date not null,
  `doc_num`           int unsigned, -- what does this do?
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             decimal(19, 4) unsigned not null default 0,
  `credit`            decimal(19, 4) unsigned not null default 0,
  `debit_equiv`       decimal(19, 4) unsigned not null default 0,
  `credit_equiv`      decimal(19, 4) unsigned not null default 0,
  `currency_id`       tinyint unsigned not null,
  `deb_cred_uuid`     char(36), -- debitor or creditor id
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         char(36),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned not null,
  `user_id`           smallint unsigned not null,
  `session_id`        int unsigned not null,
  primary key (`uuid`),
  key `project_id` (`project_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `period_id` (`period_id`),
  key `origin_id` (`origin_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  key `session_id` (`session_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  constraint foreign key (`origin_id`) references `transaction_type` (`id`) on update cascade,
  constraint foreign key (`project_id`) references `project` (`id`) on update cascade,
  constraint foreign key (`currency_id`) references `currency` (`id`) on update cascade,
  constraint foreign key (`user_id`) references `user` (`id`) on update cascade,
  constraint foreign key (`session_id`) references `posting_session` (`id`) on update cascade
) engine=innodb;

--
-- table `kpk`.`period_total`
--
drop table if exists `kpk`.`period_total`;
create table `kpk`.`period_total` (
  `enterprise_id`     smallint unsigned not null,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `account_id`        int unsigned not null,
  `credit`            decimal(19,4) unsigned,
  `debit`             decimal(19,4) unsigned,
  `locked`            boolean not null default 0,
  primary key (`enterprise_id`, `fiscal_year_id`, `period_id`, `account_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `account_id` (`account_id`),
  key `enterprise_id` (`enterprise_id`),
  key `period_id` (`period_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`account_id`) references `account` (`id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`)
) engine=innodb;

--
-- table `kpk`.`group_invoice`
--
drop table if exists `group_invoice`;
create table `group_invoice` (
  uuid            char(36) not null,
  project_id      smallint unsigned not null,
  debitor_uuid    char(36) not null,
  group_uuid      char(36) not null,
  note            text,
  authorized_by   varchar(80) not null,
  date            date not null,
  total           decimal(14, 4) not null default 0,
  primary key (`uuid`),
  key `debitor_uuid` (`debitor_uuid`),
  key `project_id` (`project_id`),
  key `group_uuid` (`group_uuid`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`group_uuid`) references `debitor_group` (`uuid`)
) engine=innodb;

--
-- table `kpk`.`group_invoice_item`
--
drop table if exists `group_invoice_item`;
create table `group_invoice_item` (
  uuid              char(36) not null,
  payment_uuid        char(36) not null,
  invoice_uuid        char(36) not null,
  cost              decimal(16, 4) unsigned not null,
  primary key (`uuid`),
  key `payment_uuid` (`payment_uuid`),
  key `invoice_uuid` (`invoice_uuid`),
  constraint foreign key (`payment_uuid`) references `group_invoice` (`uuid`) on delete cascade,
  constraint foreign key (`invoice_uuid`) references `sale` (`uuid`)) engine=innodb;

drop table if exists `journal_log`;
create table `journal_log` (
  `uuid`            char(36) not null,
  `transaction_id`  text not null,
  `justification`   text,
  `date`            date not null,
  `user_id`         smallint unsigned not null,
  primary key (`uuid`),
  foreign key (`user_id`) references `user` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`fonction`
--
drop table if exists `fonction`;
create table `fonction` (
  `id`                    tinyint unsigned not null auto_increment,
  `fonction_txt`          text not null,
  primary key (`id`)
) engine=innodb;


--
-- Table structure for table `kpk`.`service`
--
drop table if exists `service`;
create table `service` (
  `id`                   tinyint unsigned not null auto_increment,
  `service_txt`          text not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`employee`
--
drop table if exists `employee`;
create table `employee` (
  `id`                  int unsigned not null auto_increment,
  `code`                varchar(20) not null,
  `prenom`              text,
  `name`                text not null,
  `postnom`             text,
  `dob`                 date not null,
  `date_embauche`       date, -- not null,
  `phone`               varchar(20),
  `email`               varchar(70),
  `fonction_id`         tinyint unsigned, -- not null,
  `service_id`          tinyint unsigned, -- not null,
  `location_id`         char(36), -- not null,
  `creditor_uuid`       char(36), -- not null,
  `debitor_uuid`        char(36), -- not null,
  primary key (`id`),
  key `fonction_id` (`fonction_id`),
  key `service_id`  (`service_id`),
  key `location_id` (`location_id`),
  key `creditor_uuid` (`creditor_uuid`),
  key `debitor_uuid`  (`debitor_uuid`),
  constraint foreign key (`fonction_id`) references `fonction` (`id`),
  constraint foreign key (`service_id`) references `service` (`id`),
  constraint foreign key (`location_id`) references `village` (`uuid`),
  constraint foreign key (`creditor_uuid`) references `creditor` (`uuid`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`)
) engine=innodb;

drop table if exists `inventory_log`;
create table `inventory_log` (
  `uuid`                char(36) not null,
  `inventory_uuid`      char(36) not null,
  `log_timestamp`       timestamp null default CURRENT_TIMESTAMP,
  `price`               decimal(19,4) unsigned,
  `code`                varchar(30),
  `text`                text,
  primary key (`uuid`),
  key `inventory_uuid` (`inventory_uuid`),
  constraint foreign key (`inventory_uuid`) references `inventory` (`uuid`)
) engine=innodb;

-- TODO Resolve conflicts with sync triggers
-- create trigger `log_inventory_insert`
--   after insert on `inventory`
--   for each row
--   insert into `inventory_log` (`uuid`, `inventory_uuid`, `log_timestamp`, `price`, `code`, `text`) values (UUID(), new.uuid, current_timestamp, new.price, new.code, new.text);
--
-- create trigger `log_inventory_update`
--   after update on `inventory`
--   for each row
--   insert into `inventory_log` (`uuid`, `inventory_uuid`, `log_timestamp`, `price`, `code`, `text`) values (UUID(), new.uuid, current_timestamp, new.price, new.code, new.text);

--
-- Table structure for table `kpk`.`debitor_group_history`
--
drop table if exists `debitor_group_history`;
create table `debitor_group_history` (
  `uuid`                  char(36) not null,
  `debitor_uuid`          char(36) not null,
  `debitor_group_uuid`    char(36) not null,
  `income_date`           timestamp not null,
  `user_id`               smallint unsigned not null,
  primary key (`uuid`),
  key `debitor_uuid` (`debitor_uuid`),
  key `debitor_group_uuid` (`debitor_group_uuid`),
  key `user_id` (`user_id`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`),
  constraint foreign key (`debitor_group_uuid`) references `debitor_group` (`uuid`),
  constraint foreign key (`user_id`) references `user` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`client`
--
drop table if exists `client`;
create table `client` (
  `id`                   int unsigned not null auto_increment,
  `name`                 varchar(50) not null,
  `last_name`            varchar(50) not null,
  `address`              varchar(100),
  `debitor_uuid`         char(36),
  primary key (`id`),
  key `debitor_uuid` (`debitor_uuid`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`beneficiary`
--
drop table if exists `beneficiary`;
create table `beneficiary` (
  `id`                   int unsigned not null auto_increment,
  `text`                 varchar(50) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`pcash`
--
drop table if exists `pcash`;
create table `pcash` (
  `reference`       int unsigned not null auto_increment,
  `uuid`            char(36) not null,
  `project_id`      smallint unsigned not null,
  `type`            char(1) not null,
  `date`            date not null,
  `deb_cred_uuid`   char(36) null,
  `deb_cred_type`   varchar(1) null,
  `currency_id`     tinyint unsigned not null,
  `value`           decimal(19,4) unsigned not null default 0,
  `cashier_id`      smallint unsigned not null,
  `description`     text,
  `service_id`      tinyint unsigned,
  `beneficiary_id`  int unsigned,
  `istransfer`      boolean not null,
  `account_id`      int unsigned,
  `cash_box_id`     mediumint unsigned,
  `sale_uuid`       char(36) null,
  `purchase_uuid`   char(36) null,
  primary key (`uuid`),
  key `project_id` (`project_id`),
  key `reference` (`reference`),
  key `currency_id` (`currency_id`),
  key `cashier_id` (`cashier_id`),
  -- key `service_id` (`service_id`),
  -- key `beneficiary_id` (`beneficiary_id`),
  key `account_id`     (`account_id`),
  key `cash_box_id`    (`cash_box_id`),
  key `sale_uuid`      (`sale_uuid`),
  key `purchase_uuid`  (`purchase_uuid`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`cashier_id`) references `user` (`id`),
--  constraint foreign key (`service_id`) references `service` (`id`),
--  constraint foreign key (`beneficiary_id`) references `beneficiary` (`id`),
  constraint foreign key (`account_id`) references `account` (`id`),
  constraint foreign key (`cash_box_id`) references `cash_box` (`id`),
  constraint foreign key (`sale_uuid`) references `sale` (`uuid`),
  constraint foreign key (`purchase_uuid`) references `purchase` (`uuid`)
) engine=innodb;

--
-- table `kpk`.`pcash_item`
--
drop table if exists `pcash_item`;
create table `pcash_item` (
  `uuid`              varchar(36) not null,
  `pcash_uuid`        varchar(36) not null,
  `cost`             decimal (19, 4) unsigned not null default 0,
  `inv_po_id`      varchar(36),
  primary key (`uuid`),
  key `pcash_uuid` (`pcash_uuid`),
  -- key `invoice_uuid` (`invoice_uuid`),
  constraint foreign key (`pcash_uuid`) references `pcash` (`uuid`)
  -- constraint foreign key (`invoice_uuid`) references `sale` (`uuid`)
) engine=innodb;

--
-- Table structure for table `kpk`.`caution`
--
drop table if exists `caution`;
create table `caution` (
  `reference`           int unsigned not null auto_increment,
  `uuid`                char(36) not null,
  `value`               decimal(19,4) unsigned not null,
  `date`                timestamp not null,
  `project_id`          smallint unsigned not null,
  `debitor_uuid`        char(36) not null,
  `currency_id`         tinyint unsigned not null,
  `user_id`             smallint unsigned not null,
  `cash_box_id`         mediumint unsigned null,
  `description`         text,
  primary key (`uuid`),
  key `project_id` (`project_id`),
  key `reference` (`reference`),
  key `debitor_uuid` (`debitor_uuid`),
  key `currency_id` (`currency_id`),
  key `cash_box_id`  (`cash_box_id`),
  key `user_id` (`user_id`),
  constraint foreign key (`project_id`) references `project` (`id`),
  constraint foreign key (`debitor_uuid`) references `debitor` (`uuid`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`cash_box_id`) references `cash_box` (`id`),
  constraint foreign key (`user_id`) references `user` (`id`)
) engine=innodb;

-- Jon's dump @ 12:45.
