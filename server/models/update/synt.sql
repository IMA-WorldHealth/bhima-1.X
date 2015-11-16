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
