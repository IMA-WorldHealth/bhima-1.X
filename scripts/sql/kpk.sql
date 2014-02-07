drop database if exists`kpk`;
create database `kpk`;
use `kpk`;

grant all on `kpk`.* to 'kpk'@'%' identified by 'HISCongo2013';
flush privileges;

--
-- Table structure for table `kpk`.`currency`
--
drop table if exists `currency`;
create table `currency` (
  `id`            tinyint unsigned not null auto_increment,
  `name`          text not null,
  `symbol`        varchar(15) not null,
  `note`          text,
  `separator`     varchar(5),
  `decimal`       varchar(5),
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
  `rate`                    decimal(19, 2) unsigned not null,
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
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`unit`
--
drop table if exists `unit`;
create table `unit` (
  `id`            smallint unsigned not null,
  `name`          varchar(30) not null,
  `description`   text not null,
  `parent`        smallint default 0,
  `has_children`  boolean not null default 0,
  `url`           tinytext,
  `p_url`         tinytext,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`permission`
--
drop table if exists `permission`;
create table `permission` (
  `id`        mediumint unsigned not null auto_increment,
  `id_unit`   smallint unsigned not null,
  `id_user`   smallint unsigned not null,
  primary key (`id`),
  key `id_unit` (`id_unit`),
  key `id_user` (`id_user`),
  constraint foreign key (`id_unit`) references `unit` (`id`) on delete cascade on update cascade,
  constraint foreign key (`id_user`) references `user` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`country`
--
drop table if exists `country`;
create table `country` (
  `id`          smallint unsigned not null auto_increment,
  `code`        smallint unsigned not null,
  `country_en`  varchar(45) not null,
  `country_fr`  varchar(45) not null,
  primary key (`id`),
  unique key `code_unique` (`code`)
) engine=innodb;

--
-- Table structure for table `province`;
-- 
drop table if exists `province`;
create table `province` (
  `id`         smallint unsigned not null auto_increment,
  `name`       text,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `sector`;
--
drop table if exists `sector`;
create table `sector` (
  `id`        smallint unsigned not null auto_increment,
  `name`      text,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `village`;
--
drop table if exists `village`;
create table `village` (
  `id`        smallint unsigned not null auto_increment,
  `name`      text,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`location`
--
drop table if exists `location`;
create table `location` (
  `id`              smallint unsigned not null auto_increment,
  `country_id`      smallint unsigned not null,
  `province_id`     smallint unsigned not null,
  `sector_id`       smallint unsigned not null,
  `village_id`      smallint unsigned not null,
  primary key (`id`),
  key `country_id` (`country_id`),
  key `province_id` (`province_id`),
  key `sector_id` (`sector_id`),
  key `village_id` (`village_id`),
  constraint foreign key (`country_id`) references `country` (`id`),
  constraint foreign key (`province_id`) references `province` (`id`), 
  constraint foreign key (`sector_id`) references `sector` (`id`), 
  constraint foreign key (`village_id`) references `village` (`id`) 
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
  `location_id`         smallint unsigned not null,
  `logo`                varchar(70),
  `currency_id`         tinyint unsigned not null,
  primary key (`id`),
  key `location_id` (`location_id`),
  key `currency_id` (`currency_id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`location_id`) references `location` (`id`)
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
  `budget` decimal(10,2) unsigned,
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
drop table if exists `kpk`.`cost_center`;
create table `kpk`.`cost_center` (
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
  `id`            smallint unsigned not null auto_increment,
  `name`          varchar(80),
  `account_id`    int unsigned not null,
  `locked`        boolean not null default 0,
  primary key (`id`),
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
  `id`        int unsigned not null auto_increment,
  `group_id`  smallint unsigned not null,
  `text`      varchar(45),
  primary key (`id`),
  key `group_id` (`group_id`),
  constraint foreign key (`group_id`) references `creditor_group` (`id`) on delete cascade on update cascade
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

--
-- table structure for table `kpk`.`currency_account`
--
drop table if exists `currency_account`;
create table `currency_account` (
  `id`              mediumint unsigned not null auto_increment,
  `currency_id`     tinyint unsigned not null,
  `enterprise_id`   smallint unsigned not null,
  `cash_account`    int unsigned not null,
  `bank_account`    int unsigned not null,
  primary key (`id`),
  key `currency_id` (`currency_id`),
  key `enterprise_id` (`enterprise_id`),
  key `cash_account` (`cash_account`),
  key `bank_account` (`bank_account`),
  unique key (`id`, `currency_id`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`cash_account`) references `account` (`id`),
  constraint foreign key (`bank_account`) references `account` (`id`)
) engine=innodb;

--
-- table `kpk`.`price_list`
--
drop table if exists `kpk`.`price_list`;
create table `kpk`.`price_list` (
  enterprise_id   smallint unsigned not null,
  id              smallint  unsigned not null auto_increment,
  name            varchar(100) not null,
  inventory_type  smallint unsigned, -- these are not strict requirements, just for ease.
  inventory_group smallint unsigned, -- this as well.
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor_group_type`
--
drop table if exists `debitor_group_type`;
create table `debitor_group_type` (
  `id` smallint unsigned not null auto_increment,
  `type` varchar(80) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor_group`
--
drop table if exists `debitor_group`;
create table `debitor_group` (
  `enterprise_id`       smallint unsigned not null,
  `id`                  smallint unsigned auto_increment not null,
  `name`                varchar(100) not null,
  `account_id`          int unsigned not null,
  `location_id`         smallint unsigned not null,
  `payment_id`          tinyint unsigned not null default '3',
  `phone`               varchar(10) default '',
  `email`               varchar(30) default '',
  `note`                text,
  `locked`              boolean not null default 0,
  `tax_id`              smallint unsigned null,
  `max_credit`          mediumint unsigned default '0',
  `type_id`             smallint unsigned not null,
  `is_convention`        boolean not null default 0,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `account_id` (`account_id`),
  key `location_id` (`location_id`),
--  key `payment_id` (`payment_id`),
--  key `tax_id` (`tax_id`),
  key `type_id` (`type_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on delete cascade on update cascade,
  constraint foreign key (`account_id`) references `account` (`id`) on delete cascade on update cascade,
  constraint foreign key (`location_id`) references `location` (`id`) on delete cascade on update cascade,
--  constraint foreign key (`payment_id`) references `payment` (`id`) on delete cascade on update cascade,
--  constraint foreign key (`tax_id`) references `tax` (`id`),
  constraint foreign key (`type_id`) references `debitor_group_type` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`patient_group`
--
drop table if exists `patient_group`;
create table `kpk`.`patient_group` (
  enterprise_id   smallint unsigned not null,
  id              mediumint unsigned not null auto_increment,
  price_list_id   smallint unsigned not null,
  name            varchar(60) not null,
  note            text,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `price_list_id` (`price_list_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`price_list_id`) references `price_list` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor`
--
drop table if exists `debitor`;
create table `debitor` (
  `id`        int       unsigned not null auto_increment,
  `group_id`  smallint  unsigned not null,
  `text`      text,
  primary key (`id`),
  key `group_id` (`group_id`),
  constraint foreign key (`group_id`) references `debitor_group` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`supplier`
--
drop table if exists `supplier`;
create table `supplier` (
  `id`            int unsigned not null auto_increment,
  `creditor_id`   int unsigned not null,
  `name`          varchar(45) not null,
  `address_1`     text,
  `address_2`     text,
  `location_id`   smallint unsigned not null,
  `email`         varchar(45),
  `fax`           varchar(45),
  `note`          varchar(50),
  `phone`         varchar(15),
  `international` boolean not null default 0,
  `locked`        boolean not null default 0,
  primary key (`id`),
  key `creditor_id` (`creditor_id`),
  key `location_id` (`location_id`),
  constraint foreign key (`location_id`) references `location` (`id`) on delete cascade on update cascade,
  constraint foreign key (`creditor_id`) references `creditor` (`id`) on delete cascade on update cascade
) engine=innodb;

--
-- Table structure for table `kpk`.`patient`
--
drop table if exists `patient`;
create table `patient` (
  `id`                int unsigned not null auto_increment,
  `debitor_id`        int unsigned not null,
  `creditor_id`       int unsigned,
  `first_name`        varchar(150) not null,
  `last_name`         varchar(150) not null,
  `dob`               date,
  `parent_name`       varchar(150),
  `sex`               char(1) not null,
  `religion`          varchar(50),
  `marital_status`    varchar(50),
  `phone`             varchar(12),
  `email`             varchar(20),
  `addr_1`            varchar(100),
  `addr_2`            varchar(100),
  `location_id`       smallint unsigned not null,
  `registration_date` timestamp null default CURRENT_TIMESTAMP,
  primary key (`id`),
  key `first_name` (`first_name`),
  key `debitor_id` (`debitor_id`),
  key `location_id` (`location_id`),
  unique key `creditor_id` (`creditor_id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`) on update cascade,
  constraint foreign key (`location_id`) references `location` (`id`) on update cascade
) engine=innodb;


--
-- Table structure for table `kpk`.`debitor`
--
drop table if exists `assignation_patient`;
create table `assignation_patient` (
  `id`        smallint unsigned not null auto_increment,
  `patient_group_id`  mediumint  unsigned not null,
  `patient_id` int unsigned not null,
  primary key (`id`),
  key `patient_group_id` (`patient_group_id`),
  key `patient_id` (`patient_id`),
  constraint foreign key (`patient_group_id`) references `patient_group` (`id`) on delete cascade on update cascade,
  constraint foreign key (`patient_id`) references `patient` (`id`) on delete cascade on update cascade
) engine=innodb;


--
-- Table structure for table `kpk`.`inv_unit`
--
drop table if exists `inv_unit`;
create table `inv_unit` (
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
-- Table structure for table `kpk`.`inv_type`
--
drop table if exists `inv_type`;
create table `inv_type` (
  `id`    tinyint unsigned not null,
  `text`  varchar(150) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inv_group`
--
drop table if exists `inv_group`;
create table `inv_group` (
  `id`              smallint unsigned not null auto_increment,
  `name`            varchar(100) not null,
  `symbol`          char(1) not null,
  `sales_account`   mediumint unsigned not null,
  `cogs_account`    mediumint unsigned,
  `stock_account`   mediumint unsigned,
  `tax_account`     mediumint unsigned,
  primary key (`id`)
  -- key `sales_account` (`sales_account`),
  -- key `cogs_account` (`cogs_account`),
  -- key `stock_account` (`stock_account`),
  -- key `tax_account` (`tax_account`),
  -- constraint foreign key (`sales_account`) references `account` (`account_number`),
  -- constraint foreign key (`cogs_account`) references `account` (`account_number`),
  -- constraint foreign key (`stock_account`) references `account` (`account_number`),
  -- constraint foreign key (`tax_account`) references `account` (`account_number`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inventory`
--
drop table if exists `inventory`;
create table `inventory` (
  `enterprise_id` smallint unsigned not null,
  `id`            int unsigned not null auto_increment,
  `code`          varchar(10) not null,
  `text`          text,
  `price`         decimal(10,2) unsigned not null default '0.00',
  `group_id`      smallint unsigned not null,
  `unit_id`       smallint unsigned,
  `unit_weight`   mediumint default '0',
  `unit_volume`   mediumint default '0',
  `stock`         int unsigned not null default '0',
  `stock_max`     int unsigned not null default '0',
  `stock_min`     int unsigned not null default '0',
  `type_id`       tinyint unsigned not null default '0',
  `consumable`    boolean not null default 0,
  primary key (`id`),
  unique key `code` (`code`),
  key `enterprise_id` (`enterprise_id`),
  key `group_id` (`group_id`),
  key `unit_id` (`unit_id`),
  key `type_id` (`type_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`group_id`) references `inv_group` (`id`),
  constraint foreign key (`unit_id`) references `inv_unit` (`id`),
  constraint foreign key (`type_id`) references `inv_type` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`sale`
--
drop table if exists `sale`;
create table `sale` (
  `enterprise_id` smallint unsigned not null,
  `id`            int unsigned not null auto_increment,
  `cost`          decimal(19, 2) unsigned not null,
  `currency_id`   tinyint unsigned not null,
  `debitor_id`    int unsigned not null,
  `seller_id`     smallint unsigned not null default 0,
  `discount`      mediumint unsigned default '0',
  `invoice_date`  date not null, -- is this the date of the sale?
  `note`          text,
  `posted`        boolean not null default '0',
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `debitor_id` (`debitor_id`),
  key `currency_id` (`currency_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`),
  constraint foreign key (`currency_id`) references `currency` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`credit_note`
--
drop table if exists `credit_note`;
create table `credit_note` (
  `enterprise_id` smallint unsigned not null,
  `id`            int unsigned not null auto_increment,
  `cost`          decimal(19, 2) unsigned not null,
  `debitor_id`    int unsigned not null,
  `seller_id`     smallint unsigned not null default 0,
  `sale_id`       int unsigned not null,
  `note_date`     date not null,
  `description`   text,
  `posted`        boolean not null default 0,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `debitor_id` (`debitor_id`),
  key `sale_id` (`sale_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`),
  constraint foreign key (`sale_id`) references `sale` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`sale_item`
--
drop table if exists `sale_item`;
create table `sale_item` (
  `sale_id`       int unsigned not null,
  `id`            int unsigned not null auto_increment,
  `inventory_id`  int unsigned not null,
  `quantity`      int unsigned default '0',
  `unit_price`    decimal(19, 2) unsigned not null,
  `total`         decimal(19, 2) unsigned,
  primary key (`id`),
  key `sale_id` (`sale_id`),
  key `inventory_id` (`inventory_id`),
  constraint foreign key (`sale_id`) references `sale` (`id`) on delete cascade,
  constraint foreign key (`inventory_id`) references `inventory` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`purchase`
--
drop table if exists `purchase`;
create table `purchase` (
  `id`                int unsigned not null,
  `enterprise_id`     smallint unsigned not null,
  `cost`              decimal(19, 2) unsigned not null default '0',
  `currency_id`       tinyint unsigned not null,
  `creditor_id`       int unsigned not null,
  `purchaser_id`      smallint unsigned not null,
  `discount`          mediumint unsigned default '0',
  `invoice_date`      date not null,
  `note`              text default null,
  `posted`            boolean not null default 1,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `creditor_id` (`creditor_id`),
  key `purchaser_id` (`purchaser_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`creditor_id`) references `creditor` (`id`),
  constraint foreign key (`purchaser_id`) references `user` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inv_detail`
--
drop table if exists `inv_detail`;
create table `inv_detail` (
  `id`              int unsigned not null,
  `inv_id`          int unsigned not null,
  `serial_number`   text,
  `lot_number`      text,
  `delivery_date`   date,
  `po_id`           int unsigned not null,
  `expiration_date` date,
  primary key (`id`),
  key `inv_id` (`inv_id`),
  key `po_id` (`po_id`),
  constraint foreign key (`inv_id`) references `inventory` (`id`),
  constraint foreign key (`po_id`) references `purchase` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`purchase_item`
--
drop table if exists `purchase_item`;
create table `purchase_item` (
  `purchase_id`   int unsigned not null,
  `id`            int unsigned not null auto_increment,
  `inventory_id`  int unsigned not null,
  `quantity`      int unsigned default '0',
  `unit_price`    decimal(10,2) unsigned not null,
  `total`         decimal(10,2) unsigned,
  primary key (`id`),
  key `purchase_id` (`purchase_id`),
  key `inventory_id` (`inventory_id`),
  constraint foreign key (`purchase_id`) references `purchase` (`id`) on delete cascade,
  constraint foreign key (`inventory_id`) references `inventory` (`id`)
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
  `id`              int unsigned not null auto_increment,
  `enterprise_id`   smallint null,
  `bon`             char(1) not null,
  `bon_num`         int unsigned not null,
  `date`            date not null,
  `debit_account`   int unsigned not null,
  `credit_account`  int unsigned not null,
  `deb_cred_id`     int unsigned not null,
  `deb_cred_type`   varchar(1) not null,
  `currency_id`     tinyint unsigned not null,
  `cost`            decimal(19,2) unsigned not null default 0,
  `cashier_id`      smallint unsigned not null,
  `cashbox_id`      smallint unsigned not null,
  `description`            text,
  primary key (`id`),
  key `currency_id` (`currency_id`),
  key `cashier_id` (`cashier_id`),
  key `debit_account` (`debit_account`),
  key `credit_account` (`credit_account`),
  constraint foreign key (`currency_id`) references `currency` (`id`),
  constraint foreign key (`cashier_id`) references `user` (`id`),
  constraint foreign key (`debit_account`) references `account` (`id`),
  constraint foreign key (`credit_account`) references `account` (`id`)
) engine=innodb;

--
-- table `kpk`.`cash_item`
--
drop table if exists `cash_item`;
create table `cash_item` (
  `id`              int unsigned not null auto_increment,
  `cash_id`         int unsigned not null,
  `allocated_cost`  decimal(19,2) unsigned not null default 0.00,
  `invoice_id`      int unsigned not null,
  primary key (`id`),
  key `cash_id` (`cash_id`),
  key `invoice_id` (`invoice_id`),
  constraint foreign key (`cash_id`) references `cash` (`id`),
  constraint foreign key (`invoice_id`) references `sale` (`id`)
) engine=innodb;

-- 
-- Table structure for table `kpk`.`posting_session`
--
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
  `id`                mediumint unsigned not null auto_increment,
  `enterprise_id`     smallint unsigned not null,
  `fiscal_year_id`    mediumint unsigned, -- not null,
  `period_id`         mediumint unsigned, -- not null,
  `trans_id`          int unsigned not null,
  `trans_date`        date not null,
  `doc_num`           int unsigned, -- what does this do? -- why would this be not null if we don't know what it does? -- as a reminder to ask dedrick...
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             decimal (19, 4) unsigned not null default 0,
  `credit`            decimal (19, 4) unsigned not null default 0,
  `debit_equiv`       decimal (19, 4) unsigned not null default 0,
  `credit_equiv`      decimal (19, 4) unsigned not null default 0,
  `currency_id`       tinyint unsigned not null,
  `deb_cred_id`       varchar(45), -- debitor or creditor id 
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         varchar(45),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned not null,
  `user_id`           smallint unsigned not null,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `period_id` (`period_id`),
  key `origin_id` (`origin_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  constraint foreign key (`origin_id`) references `transaction_type` (`id`) on update cascade,
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on update cascade,
  constraint foreign key (`currency_id`) references `currency` (`id`) on update cascade,
  constraint foreign key (`user_id`) references `user` (`id`) on update cascade
) engine=innodb;

--
-- table `kpk`.`general_ledger`
--
drop table if exists `kpk`.`general_ledger`;
create table `kpk`.`general_ledger` (
  `id`                mediumint unsigned not null auto_increment,
  `enterprise_id`     smallint unsigned not null,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `trans_id`          int unsigned not null,
  `trans_date`        date not null,
  `doc_num`           int unsigned, -- what does this do?
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             decimal(19, 4) unsigned not null default 0,
  `credit`            decimal(19, 4) unsigned not null default 0,
  `debit_equiv`       decimal(19, 4) unsigned not null default 0,
  `credit_equiv`      decimal(19, 4) unsigned not null default 0,
  `currency_id`       tinyint unsigned not null,
  `deb_cred_id`       varchar(45), -- debitor or creditor id 
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         varchar(45),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned not null,
  `user_id`           smallint unsigned not null,
  `session_id`        int unsigned not null,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `period_id` (`period_id`),
  key `origin_id` (`origin_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  key `session_id` (`session_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  constraint foreign key (`origin_id`) references `transaction_type` (`id`) on update cascade,
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) on update cascade,
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
  `credit`            decimal(19, 2) unsigned,
  `debit`             decimal(19, 2) unsigned,
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
-- table `kpk`.`price_list_detail`
--
drop table if exists `kpk`.`price_list_detail`;
create table `kpk`.`price_list_detail` (
  id              int unsigned not null auto_increment,
  list_id         smallint unsigned not null,
  inventory_id    int unsigned not null,
  amount          decimal(19, 2) unsigned not null default 0,
  percent         boolean not null default 0,
  note            text,
  primary key (`id`),
  key `inventory_id` (`inventory_id`),
  key `list_id` (`list_id`),
  constraint foreign key (`inventory_id`) references `inventory` (`id`) on delete cascade,
  constraint foreign key (`list_id`) references `price_list` (`id`) on delete cascade
) engine=innodb;

-- 
-- table `kpk`.`group_invoice`
--
drop table if exists `group_invoice`;
create table `group_invoice` (
	id              int unsigned not null auto_increment,
  enterprise_id   smallint unsigned not null,
	debitor_id      int unsigned not null,
	group_id        smallint unsigned not null,
  note            text,
  authorized_by   varchar(80) not null,
	date            date not null,
  total           decimal(14, 4) not null default 0,
	primary key (`id`),
	key `debitor_id` (`debitor_id`),
  key `enterprise_id` (`enterprise_id`),
	key `group_id` (`group_id`),
	constraint foreign key (`debitor_id`) references `debitor` (`id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
	constraint foreign key (`group_id`) references `debitor_group` (`id`)
) engine=innodb;

--
-- table `kpk`.`group_invoice_item`
--
drop table if exists `group_invoice_item`;
create table `group_invoice_item` (
  id                int unsigned not null auto_increment,
  payment_id        int unsigned not null,
  invoice_id        int unsigned not null,
  cost              decimal(16, 4) unsigned not null,
  primary key (`id`),
  key `payment_id` (`payment_id`),
	key `invoice_id` (`invoice_id`),
  constraint foreign key (`payment_id`) references `group_invoice` (`id`) on delete cascade,
	constraint foreign key (`invoice_id`) references `sale` (`id`)
) engine=innodb;

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

-- Jon's dump @ 12:45.
