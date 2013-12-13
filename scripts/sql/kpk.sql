drop database if exists`kpk`;
create database `kpk`;
use `kpk`;

grant all on `kpk`.* to 'kpk'@'%' identified by 'HISCongo2013';
flush privileges;

--
-- Table structure for table `kpk`.`tax`
--
drop table if exists `tax`;
create table `tax` (
  `id`            smallint unsigned NOT NULL AUTO_INCREMENT,
  `registration`  mediumint unsigned NOT NULL,
  `note`          text,
  primary key (`id`)
) engine=innodb;


--
-- Table structure for table `kpk`.`currency`
--
drop table if exists `currency`;
create table `currency` (
  `id`            tinyint unsigned NOT NULL,
  `name`          text NOT NULL,
  `symbol`        varchar(15) NOT NULL,
  `note`          text,
  `current_rate`  mediumint unsigned,
  `last_rate`     mediumint unsigned,
  `updated`       date NOT NULL,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`user`
--
drop table if exists `user`;
create table `user` (
  `id`        smallint unsigned NOT NULL AUTO_INCREMENT,
  `username`  varchar(80) NOT NULL,
  `password`  varchar(100) NOT NULL,
  `first`     text NOT NULL,
  `last`      text NOT NULL,
  `email`     varchar(100),
  `logged_in` boolean NOT NULL DEFAULT 0,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`unit`
--
drop table if exists `unit`;
create table `unit` (
  `id`            smallint unsigned NOT NULL,
  `name`          varchar(30) NOT NULL,
  `description`   text NOT NULL,
  `parent`        smallint default 0,
  `has_children`  boolean NOT NULL default 0,
  `url`           tinytext,
  `p_url`         tinytext,
  primary key (`id`)
) engine=innodb;


--
-- Table structure for table `kpk`.`permission`
--
drop table if exists `permission`;
create table `permission` (
  `id`        mediumint unsigned NOT NULL AUTO_INCREMENT,
  `id_unit`   smallint unsigned NOT NULL,
  `id_user`   smallint unsigned NOT NULL,
  primary key (`id`),
  key `id_unit` (`id_unit`),
  key `id_user` (`id_user`),
  constraint foreign key (`id_unit`) references `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`id_user`) references `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb;

--
-- Table structure for table `kpk`.`country`
--
drop table if exists `country`;
create table `country` (
  `id`          smallint unsigned NOT NULL AUTO_INCREMENT,
  `code`        smallint unsigned NOT NULL,
  `country_en`  varchar(45) NOT NULL,
  `country_fr`  varchar(45) NOT NULL,
  primary key (`id`),
  unique key `code_unique` (`code`)
) engine=innodb;

--
-- Table structure for table `kpk`.`location`
--
drop table if exists `location`;
create table `location` (
  `id`          smallint unsigned NOT NULL AUTO_INCREMENT,
  `city`        varchar(45),
  `region`      varchar(45),
  `country_id`  smallint unsigned NOT NULL,
  `zone`        varchar(45),
  `village`     varchar(45),
  primary key (`id`),
  key `country_id` (`country_id`),
  constraint foreign key (`country_id`) references `country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb; 

--
-- Table structure for table `kpk`.`enterprise`
--
drop table if exists `enterprise`;
create table `enterprise` (
  `id`                  smallint unsigned NOT NULL AUTO_INCREMENT,
  `name`                text NOT NULL,
  `abbr`                varchar(50),
  `phone`               varchar(20),
  `email`               varchar(70),
  `location_id`         smallint unsigned not null,
  `cash_account`        int unsigned not null,
  `logo`                varchar(70),
  primary key (`id`),
  key `location_id` (`location_id`),
  constraint foreign key (`location_id`) references `location` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`price_group`
--
drop table if exists `price_group`;
create table `price_group` (
  `id`    smallint unsigned NOT NULL,
  `text`  varchar(100) NOT NULL,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`fiscal_year`
--
drop table if exists `fiscal_year`;
create table `fiscal_year` (
  `enterprise_id`             smallint unsigned NOT NULL,
  `id`                        mediumint unsigned NOT NULL AUTO_INCREMENT,
  `number_of_months`          mediumint unsigned NOT NULL,
  `fiscal_year_txt`           text NOT NULL,
  `transaction_start_number`  int unsigned,
  `transaction_stop_number`   int unsigned,
  `fiscal_year_number`        mediumint unsigned,
  `start_month`               int unsigned NOT NULL,
  `start_year`                int unsigned NOT NULL,
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
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL DEFAULT '0',
  `period_id` mediumint unsigned NOT NULL,
  `budget` decimal(10,2) unsigned,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`account_type`
--
drop table if exists `account_type`;
create table `account_type` (
  `id` mediumint unsigned NOT NULL,
  `type` varchar(35) NOT NULL,
  primary key (`id`)
) engine=innodb;



drop table if exists `account_category`;
create table `account_category` (
  `id`        tinyint not null,
  `title`     varchar(120) not null,
  `collection_id` tinyint not null,
  primary key (`id`)
) engine=innodb;

drop table if exists `account_collection`;
create table `account_collection` (
  `id`               tinyint not null,
  `leading_number`   tinyint not null,
  `title`            varchar(120) not null,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`account`
--
DROP TABLE IF EXISTS `account`;
create table `account` (
  `id`                  int unsigned not null,
  `account_type_id`     mediumint unsigned not null,
  `enterprise_id`       smallint unsigned not null,
  `account_number`      int not null,
  `account_txt`         text,
  `account_category_id` tinyint not null,
  `fixed`               boolean default 0,
  `locked`              tinyint unsigned default 0,
  primary key (`id`),
  key `account_type` (`account_type_id`),
  key `enterprise_id` (`enterprise_id`),
  key `account_category_id` (`account_category_id`),
  constraint foreign key (`account_type_id`) references `account_type` (`id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
  -- constraint foreign key (`account_category_id`) references `account_category` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`creditor_group`
--
drop table if exists `creditor_group`;
create table `creditor_group` (
  `id`          smallint NOT NULL AUTO_INCREMENT,
  `group_txt`   varchar(45),
  `account_id`  int unsigned NOT NULL,
  primary key (`id`),
  key `account_id` (`account_id`),
  constraint foreign key (`account_id`) references `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb;

--
-- Table structure for table `kpk`.`creditor`
--
drop table if exists `creditor`;
create table `creditor` (
  `id`                int unsigned NOT NULL AUTO_INCREMENT,
  `creditor_group_id` smallint NOT NULL,
  `text`      varchar(45),
  primary key (`id`),
  key `creditor_group_id` (`creditor_group_id`),
  constraint foreign key (`creditor_group_id`) references `creditor_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb;

--
-- Table structure for table `kpk`.`payment`
--

drop table if exists `payment`;
create table `payment` (
  `id`      tinyint unsigned NOT NULL,
  `days`    smallint unsigned DEFAULT '0',
  `months`  mediumint unsigned DEFAULT '0',
  `text`    varchar(50) NOT NULL,
  `note`    text,
  primary key (`id`)
) engine=innodb;

--
-- table `kpk`.`price_list_name`
--
drop table if exists `kpk`.`price_list_name`;
create table `kpk`.`price_list_name` (
  enterprise_id   smallint unsigned not null,
  id              smallint  unsigned not null,
  name            varchar(100) not null,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor_group_type`
--
drop table if exists `debitor_group_type`;
create table `debitor_group_type` (
  `id` smallint unsigned NOT NULL auto_increment,
  `type` varchar(80) NOT NULL,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor_group`
--
drop table if exists `debitor_group`;
create table `debitor_group` (
  `enterprise_id`       smallint unsigned NOT NULL,
  `id`                  smallint unsigned AUTO_INCREMENT NOT NULL,
  `name`                varchar(100) NOT NULL,
  `account_id`          int unsigned NOT NULL,
  `location_id`         smallint unsigned NOT NULL,
  `payment_id`          tinyint unsigned NOT NULL DEFAULT '3',
  `phone`               varchar(10) DEFAULT '',
  `email`               varchar(30) DEFAULT '',
  `note`                text,
  `locked`              boolean NOT NULL DEFAULT 0,
  `contact_id`          smallint unsigned,
  `price_list_id`       smallint unsigned,
  `tax_id`              smallint unsigned NULL,
  `max_credit`          mediumint unsigned DEFAULT '0',
  `type_id`             smallint unsigned NOT NULL,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `account_id` (`account_id`),
  key `location_id` (`location_id`),
  key `payment_id` (`payment_id`),
  key `contact_id` (`contact_id`),
  key `price_list_id` (`price_list_id`),
  key `tax_id` (`tax_id`),
  key `type_id` (`type_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`price_list_id`) references `price_list_name` (`id`),
  constraint foreign key (`account_id`) references `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`location_id`) references `location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`payment_id`) references `payment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`tax_id`) references `tax` (`id`),
  constraint foreign key (`type_id`) references `debitor_group_type` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`debitor`
--
drop table if exists `debitor`;
create table `debitor` (
  `id`        int       unsigned NOT NULL auto_increment,
  `group_id`  smallint  unsigned NOT NULL,
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
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `creditor_id`   int unsigned NOT NULL,
  `name`          varchar(45) NOT NULL,
  `address_1`     text,
  `address_2`     text,
  `location_id`   smallint unsigned NOT NULL,
  `email`         varchar(45),
  `fax`           varchar(45),
  `note`          varchar(50),
  `phone`         varchar(15),
  `international` boolean NOT NULL DEFAULT 0,
  `locked`        boolean NOT NULL DEFAULT 0,
  primary key (`id`),
  key `creditor_id` (`creditor_id`),
  key `location_id` (`location_id`),
  constraint foreign key (`location_id`) references `location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`creditor_id`) references `creditor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb;

--
-- Table structure for table `kpk`.`patient`
--
drop table if exists `patient`;
create table `patient` (
  `id`              int unsigned NOT NULL AUTO_INCREMENT,
  `debitor_id`      int unsigned NOT NULL,
  `creditor_id`     int unsigned,
  `first_name`      varchar(150) NOT NULL,
  `last_name`       varchar(150) NOT NULL,
  `dob`             date,
  `parent_name`     varchar(150),
  `sex`             char(1) NOT NULL,
  `religion`        varchar(50),
  `marital_status`  varchar(50),
  `phone`           varchar(12),
  `email`           varchar(20),
  `addr_1`          varchar(100),
  `addr_2`          varchar(100),
  `location_id`     smallint unsigned NOT NULL,
  primary key (`id`),
  key `first_name` (`first_name`),
  key `debitor_id` (`debitor_id`),
  key `location_id` (`location_id`),
  unique key `creditor_id` (`creditor_id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`location_id`) references `location` (`id`) ON UPDATE CASCADE
) engine=innodb;


--
-- Table structure for table `kpk`.`inv_unit`
--
drop table if exists `inv_unit`;
create table `inv_unit` (
  `id`    smallint unsigned NOT NULL AUTO_INCREMENT,
  `text`  varchar(100) NOT NULL,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`period`
--
drop table if exists `period`;
create table `period` (
  `id`              mediumint unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id`  mediumint unsigned NOT NULL,
  `period_start`    date NOT NULL,
  `period_stop`     date NOT NULL,
  `locked`          boolean not null default 0,
  primary key (`id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`department`
--
drop table if exists `department`;
create table `department` (
  `enterprise_id` smallint unsigned NOT NULL,
  `id`            smallint unsigned NOT NULL,
  `name`          varchar(100) NOT NULL,
  `note`          text,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb;

--
-- Table structure for table `kpk`.`employee`
--
drop table if exists `employee`;
create table `employee` (
  `id`            smallint unsigned NOT NULL,
  `name`          varchar(50) NOT NULL,
  `title`         varchar(50),
  `debitor_id`    int unsigned NOT NULL,
  `creditor_id`   int unsigned NOT NULL,
  `location_id`   smallint unsigned NOT NULL,
  `department_id` smallint unsigned NOT NULL,
  `initials`      varchar(3) NOT NULL,
  primary key (`id`),
  key `debitor_id` (`debitor_id`),
  key `location_id` (`location_id`),
  key `department_id` (`department_id`),
  key `creditor_id` (`creditor_id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`location_id`) references `location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`creditor_id`) references `creditor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  constraint foreign key (`department_id`) references `department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) engine=innodb;

--
-- Table structure for table `kpk`.`inv_type`
--
drop table if exists `inv_type`;
create table `inv_type` (
  `id`    tinyint unsigned NOT NULL,
  `text`  varchar(150) NOT NULL,
  primary key (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`inv_group`
--
drop table if exists `inv_group`;
create table `inv_group` (
  `id`              smallint unsigned NOT NULL,
  `name`            varchar(100) NOT NULL,
  `symbol`          char(1) NOT NULL,
  `sales_account`   mediumint unsigned NOT NULL,
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
  `enterprise_id` smallint unsigned NOT NULL,
  `id`            int unsigned NOT NULL,
  `code`          varchar(10) NOT NULL,
  `text`          text,
  `price`         decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `group_id`      smallint unsigned NOT NULL,
  `unit_id`       smallint unsigned,
  `unit_weight`   mediumint DEFAULT '0',
  `unit_volume`   mediumint DEFAULT '0',
  `stock`         int unsigned NOT NULL DEFAULT '0',
  `stock_max`     int unsigned NOT NULL DEFAULT '0',
  `stock_min`     int unsigned NOT NULL DEFAULT '0',
  `type_id`       tinyint unsigned NOT NULL DEFAULT '0',
  `consumable`    boolean NOT NULL DEFAULT 0,
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
  `enterprise_id` smallint unsigned NOT NULL,
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `cost`          decimal(19, 2) unsigned NOT NULL,
  `currency_id`   tinyint unsigned NOT NULL,
  `debitor_id`    int unsigned NOT NULL,
  `seller_id`     smallint unsigned NOT NULL,
  `discount`      mediumint unsigned DEFAULT '0',
  `invoice_date`  date NOT NULL, -- is this the date of the sale?
  `note`          text,
  `posted`        boolean NOT NULL DEFAULT '0',
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `debitor_id` (`debitor_id`),
  key `currency_id` (`currency_id`),
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`),
  constraint foreign key (`debitor_id`) references `debitor` (`id`),
  constraint foreign key (`currency_id`) references `currency` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`sale_item`
--
drop table if exists `sale_item`;
create table `sale_item` (
  `sale_id`       int unsigned NOT NULL,
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id`  int unsigned NOT NULL,
  `quantity`      int unsigned DEFAULT '0',
  `unit_price`    int unsigned NOT NULL,
  `total`         int unsigned,
  primary key (`id`),
  key `sale_id` (`sale_id`),
  key `inventory_id` (`inventory_id`),
  constraint foreign key (`sale_id`) references `sale` (`id`) ON DELETE CASCADE,
  constraint foreign key (`inventory_id`) references `inventory` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`purchase`
--
drop table if exists `purchase`;
create table `purchase` (
  `id`                int unsigned NOT NULL,
  `enterprise_id`     smallint unsigned NOT NULL,
  `cost`              int unsigned NOT NULL DEFAULT '0',
  `currency_id`       tinyint unsigned NOT NULL,
  `creditor_id`       int unsigned NOT NULL,
  `purchaser_id`      smallint unsigned NOT NULL,
  `discount`          mediumint unsigned DEFAULT '0',
  `invoice_date`      date NOT NULL,
  `note`              text default null,
  `posted`            boolean NOT NULL DEFAULT 0,
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
  `id`              int unsigned NOT NULL,
  `inv_id`          int unsigned NOT NULL,
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
  `purchase_id`   int unsigned NOT NULL,
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id`  int unsigned NOT NULL,
  `quantity`      int unsigned DEFAULT '0',
  `unit_price`    decimal(10,2) unsigned NOT NULL,
  `total`         decimal(10,2) unsigned,
  primary key (`id`),
  key `purchase_id` (`purchase_id`),
  key `inventory_id` (`inventory_id`),
  constraint foreign key (`purchase_id`) references `purchase` (`id`) ON DELETE CASCADE,
  constraint foreign key (`inventory_id`) references `inventory` (`id`)
) engine=innodb;

--
-- Table structure for table `kpk`.`transaction_type`
--
drop table if exists `transaction_type`;
create table `transaction_type` (
  `id`            tinyint unsigned NOT NULL AUTO_INCREMENT,
  `service_txt`   varchar(45) NOT NULL,
  primary key (`id`)
) engine=innodb;


--
-- table `kpk`.`account_group`
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

--
-- Table structure for table `kpk`.`cash`
--
drop table if exists `cash`;
create table `cash` (
  `id`              int unsigned NOT NULL auto_increment,
  `enterprise_id`   smallint null,
  `bon`             char(1) NOT NULL,
  `bon_num`         int unsigned NOT NULL,
  `date`            date NOT NULL,
  `debit_account`   int unsigned NOT NULL,
  `credit_account`  int unsigned NOT NULL,
  `deb_cred_id`     int unsigned not null,
  `deb_cred_type`   varchar(1) not null,
  `currency_id`     tinyint unsigned NOT NULL,
  `cost`            decimal(19,2) unsigned not null default 0,
  `cashier_id`      smallint unsigned NOT NULL,
  `cashbox_id`      smallint unsigned NOT NULL,
  `text`            text,
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
-- Table structure for table `kpk`.`posting_journal`
--
drop table if exists `posting_journal`;
create table `posting_journal` (
  `id`                mediumint unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id`     smallint unsigned NOT NULL,
  `fiscal_year_id`    mediumint unsigned, -- not null,
  `period_id`         mediumint unsigned, -- not null,
  `trans_id`          int unsigned NOT NULL,
  `trans_date`        date NOT NULL,
  `doc_num`           int unsigned, -- what does this do? -- why would this be NOT NULL if we don't know what it does? -- as a reminder to ask dedrick...
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             decimal (19,2) unsigned not null default 0,
  `credit`            decimal (19,2) unsigned not null default 0,
  `debit_equiv`       decimal (19,2) unsigned not null default 0,
  `credit_equiv`      decimal (19,2) unsigned not null default 0,
  `currency_id`       tinyint unsigned NOT NULL,
  `deb_cred_id`       varchar(45), -- debitor or creditor id 
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         varchar(45),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned NOT NULL,
  `user_id`           smallint unsigned NOT NULL,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `period_id` (`period_id`),
  key `origin_id` (`origin_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  constraint foreign key (`origin_id`) references `transaction_type` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`currency_id`) references `currency` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`user_id`) references `user` (`id`) ON UPDATE CASCADE
) engine=innodb;

--
-- table `kpk`.`general_ledger`
--
drop table if exists `kpk`.`general_ledger`;
create table `kpk`.`general_ledger` (
  `id`                mediumint unsigned NOT NULL AUTO_INCREMENT,
  `enterprise_id`     smallint unsigned NOT NULL,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `trans_id`          int unsigned NOT NULL,
  `trans_date`        date NOT NULL,
  `doc_num`           int unsigned, -- what does this do?
  `description`       text,
  `account_id`        int unsigned not null,
  `debit`             int unsigned,
  `credit`            int unsigned,
  `debit_equiv`       int unsigned,
  `credit_equiv`      int unsigned,
  `currency_id`       tinyint unsigned NOT NULL,
  `deb_cred_id`       varchar(45), -- debitor or creditor id 
  `deb_cred_type`     char(1), -- 'D' or 'C' if debcred_id references a debitor or creditor, respectively
  `inv_po_id`         varchar(45),
  `comment`           text,
  `cost_ctrl_id`      varchar(10),
  `origin_id`         tinyint unsigned NOT NULL,
  `user_id`           smallint unsigned NOT NULL,
  primary key (`id`),
  key `enterprise_id` (`enterprise_id`),
  key `fiscal_year_id` (`fiscal_year_id`),
  key `period_id` (`period_id`),
  key `origin_id` (`origin_id`),
  key `currency_id` (`currency_id`),
  key `user_id` (`user_id`),
  constraint foreign key (`fiscal_year_id`) references `fiscal_year` (`id`),
  constraint foreign key (`period_id`) references `period` (`id`),
  constraint foreign key (`origin_id`) references `transaction_type` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`enterprise_id`) references `enterprise` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`currency_id`) references `currency` (`id`) ON UPDATE CASCADE,
  constraint foreign key (`user_id`) references `user` (`id`) ON UPDATE CASCADE
) engine=innodb;

--
-- table `kpk`.`period_total`
--
drop table if exists `kpk`.`period_total`;
create table `kpk`.`period_total` (
  `enterprise_id`     smallint unsigned not null,
  `id`                mediumint unsigned not null,
  `fiscal_year_id`    mediumint unsigned not null,
  `period_id`         mediumint unsigned not null,
  `account_id`        int unsigned not null,
  `credit`            decimal(19, 2) unsigned,
  `debit`             decimal(19, 2) unsigned,
  `difference`        decimal(19, 2) unsigned, 
  `locked`            boolean not null default 0,
  primary key (`id`),
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
-- table `kpk`.`price_list`
--
drop table if exists `kpk`.`price_list`;
create table `kpk`.`price_list` (
  id              int unsigned not null,
  list_id         smallint unsigned not null,
  inventory_id    int unsigned not null,
  price           decimal(19, 2) unsigned not null default 0,
  discount        decimal(3, 2) unsigned not null default 0,
  note            text, 
  primary key (`id`),
  key `inventory_id` (`inventory_id`),
  key `list_id` (`list_id`),
  constraint foreign key (`inventory_id`) references `inventory` (`id`),
  constraint foreign key (`list_id`) references `price_list_name` (`id`)
) engine=innodb;

-- Jon's dump @ 12:45.
