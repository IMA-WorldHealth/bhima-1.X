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


