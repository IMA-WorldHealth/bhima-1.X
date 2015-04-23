-- Add a new table employee_invoice AND employee_invoice_item
-- 
--
-- Date: 2015-02-16
-- By: Chris LOMAME

use bhima;

drop table if exists `employee_invoice`;
create table `employee_invoice` (
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

drop table if exists `employee_invoice_item`;
create table `employee_invoice_item` (
  uuid              char(36) not null,
  payment_uuid        char(36) not null,
  invoice_uuid        char(36) not null,
  cost              decimal(16, 4) unsigned not null,
  primary key (`uuid`),
  key `payment_uuid` (`payment_uuid`),
  key `invoice_uuid` (`invoice_uuid`),
  constraint foreign key (`payment_uuid`) references `employee_invoice` (`uuid`) on delete cascade,
  constraint foreign key (`invoice_uuid`) references `sale` (`uuid`)) engine=innodb;

