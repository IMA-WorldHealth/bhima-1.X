-- Patient Visit Status
-- By: bruce M.
-- Date: 2015-11-11

INSERT INTO `unit` (`id`, `name`, `key`, `parent`, `url`, `path`) VALUES
(134, "Patient Visit Status", "TREE.PATIENT_VISIT_STATUS", 127, "/partials/reports/patient_visit_status/", "/reports/patient_visit_status/");

-- IPR integer unsigned
-- By: Bruce M.
-- Date: 2015-11-15

ALTER TABLE `taxe_ipr` CHANGE `tranche_annuelle_debut` `tranche_annuelle_debut` INT UNSIGNED NULL DEFAULT NULL;
ALTER TABLE `taxe_ipr` CHANGE `tranche_annuelle_fin` `tranche_annuelle_fin` INT UNSIGNED NULL DEFAULT NULL;

-- Grade Integer
-- By: Bruce M.
-- Date: 2015-11-15

ALTER TABLE `grade` CHANGE `text` `text` FLOAT(4) NOT NULL;

-- Transaction type for service returning stock
-- By: Bruce M.
-- Date: 2015-11-17

INSERT INTO `bhima`.`transaction_type` (`id`, `service_txt`) VALUES (34, 'service_return_stock');

-- Stock entries report
-- By: Bruce M.
-- Date: 2015-11-06
INSERT INTO unit (`id`, `name`, `key`, `description`, `parent`, `url`, `path`) VALUES
(135, 'Stock Entry Report', 'TREE.STOCK_ENTRY_REPORT', 'Rapport des entrees de stock' , 125, '/partials/reports/stock/stock_entry', '/reports/stock_entry');
