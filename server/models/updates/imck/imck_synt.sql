USE bhima;

-- Updates account
--
-- ADD 'is_ohada' field
--
-- Date: 2015-04-27
-- By: Chris LOMAME
ALTER TABLE `account`
ADD `is_ohada` BOOLEAN NULL;

-- Updates unit
--
-- Move Account, Fiscal_year, Creditor_group, debitor_group to Accountant Node
--
-- Date: 2015-04-28
-- By: Bruce Mbayo
UPDATE `unit` SET `unit`.`parent`=30 WHERE `unit`.`id` IN (6, 13, 23, 24); 

-- Cashbox and Cashbox account currency
--
-- Date: 2015-04-30
-- By: Bruce Mbayo
INSERT INTO `unit` VALUES
(105,'Cashbox Management','TREE.CASHBOX_MANAGEMENT','',1,0,'/partials/cash/cashbox/','/cashbox_management/'),
(106,'Cashbox Account currency Management','TREE.CASHBOX_ACCOUNT_MANAGEMENT','',30,0,'/partials/cash/cashbox_account_currency/','/cashbox_account_management/');

ALTER TABLE `cash_box`
ADD `is_bank` BOOLEAN NULL;

ALTER TABLE `cash_box_account_currency`
ADD `virement_account_id` int(11) NULL;