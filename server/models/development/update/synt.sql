USE bhima;


-- Jonathan Niles
-- 11/08/2015
-- Change the journal URL to /journal rather than /posting_journal
UPDATE unit SET `url` = '/partials/journal/journal.html', `path` = '/journal' WHERE id = 9;

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


-- Update user table
-- Change logged_in to online
-- Add column last_login DATE
-- Encrypt user passwords
--
-- Date: 2015-08-13
-- By: jniles
ALTER TABLE `user` CHANGE `logged_in` `active` TINYINT NOT NULL DEFAULT 0;
ALTER TABLE `user` ADD COLUMN `last_login` DATE NOT NULL;
UPDATE `user` SET `password` = PASSWORD(`password`);


-- Adding column is_charge 
-- Date: 2015-08-20
-- By: Chris LOMAME
--
ALTER TABLE `account`
ADD `is_charge` BOOLEAN NULL;


USE bhima;

-- Updates table account
-- Updating the column is_charge column following the accounting standard OHADA
--
-- Date: 2015-08-20
-- By: Chris LOMAME

UPDATE `account` SET `is_charge`= NULL;
UPDATE `account` SET `is_charge` =1 WHERE `classe`=6 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=81 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=83 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=85 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =1 WHERE LEFT(`account_number`,2)=89 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE `classe`=7 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=82 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=84 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=86 AND `account_type_id` =1 AND `is_ohada` =1;
UPDATE `account` SET `is_charge` =0 WHERE LEFT(`account_number`,2)=88 AND `account_type_id` =1 AND `is_ohada` =1;


USE bhima;

-- Updating some Elements of table transaction_type
--
-- Date: 2015-08-27
-- By: Chris LOMAME

-- Delete transaction_type purchase unused
DELETE FROM `transaction_type` WHERE `transaction_type`.`id` = 3;


UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'import_automatique' WHERE  `transaction_type`.`id` =9;
UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'group_deb_invoice' WHERE  `transaction_type`.`id` =5;
UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'stock_loss' WHERE  `transaction_type`.`id` =13;
UPDATE  `bhima`.`transaction_type` SET  `service_txt` =  'reversing_stock' WHERE  `transaction_type`.`id` =28;

-- Add a test user (id:39) to user table
--
-- Date: 2015-08-31
-- By: jniles
INSERT INTO user (id, username, password, first, last, email) VALUES (39, 'test', PASSWORD('test'), 'Test', 'Test', 'test@test.org');
INSERT INTO permission (unit_id, user_id) VALUES (1, 39), (2, 39), (4, 39), (5, 39), (6, 39), (7, 39), (8, 39), (9, 39), (10, 39), (11, 39), (12, 39), (13, 39), (14, 39), (15, 39), (16, 39), (17, 39), (18, 39), (19, 39), (20, 39), (21, 39), (22, 39), (23, 39), (24, 39), (25, 39), (26, 39), (27, 39), (28, 39), (29, 39), (30, 39), (31, 39), (32, 39), (34, 39), (35, 39), (36, 39), (37, 39), (38, 39), (39, 39), (40, 39), (41, 39), (42, 39), (43, 39), (44, 39), (45, 39), (46, 39), (48, 39), (49, 39), (50, 39), (51, 39), (53, 39), (54, 39), (55, 39), (56, 39), (57, 39), (58, 39), (59, 39), (60, 39), (61, 39), (62, 39), (63, 39), (64, 39), (65, 39), (66, 39), (67, 39), (68, 39), (69, 39), (70, 39), (71, 39), (72, 39), (73, 39), (74, 39), (75, 39), (76, 39), (77, 39), (78, 39), (79, 39), (80, 39), (81, 39), (82, 39), (83, 39), (84, 39), (85, 39), (86, 39), (87, 39), (88, 39), (89, 39), (90, 39), (91, 39), (92, 39), (93, 39), (97, 39), (98, 39), (99, 39), (100, 39), (101, 39), (102, 39), (103, 39), (105, 39), (106, 39), (107, 39), (108, 39), (109, 39), (110, 39), (111, 39), (112, 39), (113, 39), (114, 39);
INSERT INTO project_permission (project_id, user_id) VALUES (1, 39), (2, 39);

