USE bhima;

-- Updates account
--
-- ADD 'is_ohada' field
--
-- Date: 2015-04-27
-- By: Chris LOMAME
ALTER TABLE `account`
ADD `is_ohada` BOOLEAN;

-- Updates unit
--
-- Move Account, Fiscal_year, Creditor_group, debitor_group to Accountant Node
--
-- Date: 2015-04-28
-- By: Bruce Mbayo
UPDATE `unit` SET `unit`.`parent`=30 WHERE `unit`.`id` IN (6, 13, 23, 24); 

-- Adding Transaction type for Confirm Integration and Confirm Integration in unit
-- 
-- Date: 2015-04-29
-- By: Bruce Mbayo
INSERT INTO `transaction_type` VALUES 
(32, 'confirm_integration');

INSERT INTO `unit` VALUES 
(103,'Confirmation Stock Integration','TREE.CONFIRM_INTEGRATION','',11,0,'/partials/stock/integration/confirm_integration','/stock/integration_confirm/');

ALTER TABLE `purchase`
ADD `is_integration` BOOLEAN NULL;

-- Updates patient
--
-- ADD 'name_middle' field
-- ADD 'hospital_no' field
--
-- Date: 2015-04-30
-- By: Chris LOMAME

USE bhima;

ALTER TABLE `patient`
ADD `middle_name` varchar(150);


ALTER TABLE `patient`
ADD `hospital_no` varchar(150);