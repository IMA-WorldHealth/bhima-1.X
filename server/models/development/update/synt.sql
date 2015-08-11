USE bhima;

--
-- Dedrick Kitamuka
-- 22/07/2015
-- Adding a new unit for resultat comptable
--

INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `has_children`, `url`, `path`)
VALUES (114, 'compte de resultat', 'TREE.COMPTE_RESULTAT', 'pour voir le rapport de compte de resultat', 10, 0, '/partials/reports/result_account', '/reports/result_account/');

-- Updates table account
-- Updating the is_asset column following the accounting standard
--
-- Date: 2015-08-04
-- By: Chris LOMAME


UPDATE `account` SET `is_asset`=FALSE;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=2 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=3 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=41 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,4)=4711 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=476 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,3)=478 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=5 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE `classe`=6 AND account_number AND `account_number` NOT LIKE '603%' AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=73 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=81 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=83 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=85 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=87 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=TRUE WHERE LEFT(`account_number`,2)=89 AND `is_ohada` =1;
UPDATE `account` SET `is_asset`=NULL WHERE `parent`=0 AND `is_ohada` =1;



USE bhima;

-- Update all inventory type where inventory type is assembly to Article
--
-- Date: 2015-08-11
-- By: Chris LOMAME

UPDATE `inventory` SET `inventory`.`type_id` = 1, `inventory`.`consumable` = 1  WHERE `inventory`.`type_id` = 2;


USE bhima;

-- Remove inventory type Discount
--
-- Date: 2015-08-11
-- By: Chris LOMAME

DELETE FROM `inventory_type` WHERE `inventory_type`.`id` = 4;


