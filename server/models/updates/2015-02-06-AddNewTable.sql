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
