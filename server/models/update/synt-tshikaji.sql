-- Cash flow and liquidity flow reports 
-- By: Bruce M.
-- Date: 2016-03-16

-- INSERT INTO `unit` (`id`, `name`, `key`, `parent`, `url`, `path`) VALUES
-- (140, "Cashflow Report", "TREE.CASH_FLOW", 128, "/partials/reports/cash_flow/", "/reports/cash_flow/");

-- Fix deprecated functionalities
-- NOTA : BE SURE THE DATABASE IS THE SAME
-- Bruce M.
-- 2016-03-28 

-- Account/Report/balance sheet
-- id : 87
-- path : /reports/balance/

DELETE FROM `permission` WHERE `unit_id` = 87;
DELETE FROM `unit` WHERE `id` = 87;

-- Account/Report/grand livre
-- id : 89
-- path : /reports/grand_livre/

DELETE FROM `permission` WHERE `unit_id` = 89;
DELETE FROM `unit` WHERE `id` = 89;

-- Account/Report/tfr
-- id : 88
-- path : /reports/tfr/

DELETE FROM `permission` WHERE `unit_id` = 88;
DELETE FROM `unit` WHERE `id` = 88;

-- Fix origin of transactions 
-- MOVE TO GENERIC INCOME AND GENERIC EXPENSE
-- Bruce M.
-- 2016-03-28 

-- INCOMES

-- Move from journal and journal voucher to generic income (origin_id = 11)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 11 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%REC GEN%';

UPDATE `general_ledger` SET `origin_id` = 11 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%REC GEN%';

-- Move from journal and journal voucher to convention (origin_id = 8)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 8 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%CAISSEPRINCIPALE_CONVENTION%';

UPDATE `general_ledger` SET `origin_id` = 8 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%CAISSEPRINCIPALE_CONVENTION%';

-- Move from journal and journal voucher to prise en charge (origin_id = 25)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 25 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%CAISSEPRINCIPALE_EMPLOYEE%';

UPDATE `general_ledger` SET `origin_id` = 25
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%CAISSEPRINCIPALE_EMPLOYEE%';

-- Move from journal and journal voucher to transfert (origin_id = 10)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 10 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%CASH_BOX_VIRMENT%';

UPDATE `general_ledger` SET `origin_id` = 10
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%CASH_BOX_VIRMENT%';

-- EXPENSES 
-- Move from journal and journal voucher to generic expense (origin_id = 20)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 20 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%DEP GEN%';

UPDATE `general_ledger` SET `origin_id` = 20 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%DEP GEN%';

-- Move from journal and journal voucher to achat (origin_id = 21)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 21 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%PAIE C.A%';

UPDATE `general_ledger` SET `origin_id` = 21 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%PAIE C.A%';

-- Move from journal and journal voucher to remboursement (origin_id = 27)
-- journal (origin_id = 4)
-- group_deb_invoice (journal voucher) (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 27 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%REMBOUR_C.P%';

UPDATE `general_ledger` SET `origin_id` = 27 
WHERE `origin_id` IN (4, 5) AND `description` LIKE '%REMBOUR_C.P%';


-- Caisse principale HBB USD (account_id = 2939)
-- Caisse principale HBB CDF (account_id = 2935)
-- Caisse principale BCDC USD (account_id = 2923)
-- Move to journal voucher (origin_id = 5)
UPDATE `posting_journal` SET `origin_id` = 5 
WHERE `origin_id` = 4 AND YEAR(`trans_date`) = "2015" AND account_id IN (2939, 2935, 2923);

UPDATE `general_ledger` SET `origin_id` = 5 
WHERE `origin_id` = 4 AND YEAR(`trans_date`) = "2015" AND account_id IN (2939, 2935, 2923);
