-- ADD FOREIGN KEY account_type_id
--
-- Date: 2015-02-23
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `account`
ADD FOREIGN KEY (`account_type_id`) REFERENCES `account_type` (`id`);
