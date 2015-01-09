use bhima;

set @group_uuid = UUID();
set @supplier_uuid = UUID();
set @employee_creditor_uuid = UUID();
set @employee_debitor_uuid = UUID();
set @supplier_creditor_uuid = UUID();
set @grade_uuid = UUID();

-- Oh lawd
set @location_uuid = (SELECT uuid from village where name = "TSHIKAJI");
set @debitor_group_uuid = (SELECT uuid from debitor_group LIMIT 1);

insert into grade values (@grade_uuid, "C1", "Docteur", 100);
insert into fonction values (1,'Docteur');
insert into creditor_group values (200, @group_uuid, 'Employees', 187, 0);

insert into creditor values (@employee_creditor_uuid, @group_uuid, "Creditor for Employee A");
insert into creditor values (@supplier_creditor_uuid, @group_uuid, "Creditor for Supplier A");
insert into debitor values (@employee_debitor_uuid, @debitor_group_uuid, "Debitor for Employee A");
-- insert into employee (code, name, sexe, dob, nb_spouse, nb_enfant, grade_id, daily_salary, creditor_uuid, debitor_uuid) values ("0100", "Employee A", "M", "1993-06-06", 1, 1, @grade_uuid, 1.5,  @employee_creditor_uuid, @employee_debitor_uuid);

insert into supplier (uuid, creditor_uuid, name, location_id, international, locked) values (@supplier_uuid, @supplier_creditor_uuid, "Supplier A", @location_uuid, 0, 0);

insert into depot (uuid, text, enterprise_id) values
  (UUID(), "Warehouse", 200),
  (UUID(), "Pharmacy 1", 200),
  (UUID(), "Pharmacy 2", 200);

UPDATE `account` SET `classe`=1 WHERE LEFT(`account_number`,1)=1;
UPDATE `account` SET `classe`=2 WHERE LEFT(`account_number`,1)=2;
UPDATE `account` SET `classe`=3 WHERE LEFT(`account_number`,1)=3;
UPDATE `account` SET `classe`=4 WHERE LEFT(`account_number`,1)=4;
UPDATE `account` SET `classe`=5 WHERE LEFT(`account_number`,1)=5;
UPDATE `account` SET `classe`=6 WHERE LEFT(`account_number`,1)=6;
UPDATE `account` SET `classe`=7 WHERE LEFT(`account_number`,1)=7;
UPDATE `account` SET `classe`=8 WHERE LEFT(`account_number`,1)=8;
UPDATE `account` SET `classe`=9 WHERE LEFT(`account_number`,1)=9;

-- PAYROLL CONFIGURATION DATA

INSERT INTO `cotisation` (`id`, `label`, `abbr`, `is_employee`, `is_percent`, `four_account_id`, `six_account_id`, `value`) VALUES
(1, 'INSS', 'ins1', 0, 1, 187, 886, 2),
(2, 'INSS Entreprise', 'ins2', 1, 1, 187, 886, 3);


INSERT INTO `config_cotisation` (`id`, `label`) VALUES
(1, 'Configuration cotisation par defaut');


INSERT INTO `config_cotisation_item` (`id`, `config_cotisation_id`, `cotisation_id`, `payable`) VALUES
(1, 1, 1, NULL),
(2, 1, 2, NULL);


INSERT INTO `paiement_period` (`id`, `config_tax_id`, `config_rubric_id`, `config_cotisation_id`, `config_accounting_id`, `label`, `dateFrom`, `dateTo`) VALUES
(1, 1, 1, 1, 1, 'JANVIER 2015', '2015-01-01', '2015-01-31'),
(2, 1, 1, 1, 1, 'FEVRIER 2015', '2015-02-02', '2015-02-27');


INSERT INTO `config_paiement_period` (`id`, `paiement_period_id`, `weekFrom`, `weekTo`) VALUES
(1, 1, '2015-01-01', '2015-01-02'),
(2, 1, '2015-01-05', '2015-01-09'),
(3, 1, '2015-01-12', '2015-01-16'),
(4, 1, '2015-01-19', '2015-01-23'),
(5, 1, '2015-01-26', '2015-01-30'),
(6, 2, '2015-02-02', '2015-02-06'),
(7, 2, '2015-02-09', '2015-02-13'),
(8, 2, '2015-02-16', '2015-02-20'),
(9, 2, '2015-02-23', '2015-02-27');


INSERT INTO `tax` (`id`, `label`, `abbr`, `is_employee`, `is_percent`, `is_ipr`, `four_account_id`, `six_account_id`, `value`) VALUES
(1, 'ONEM', 'onm', 0, 1, 0, 187, 886, 3),
(2, 'ONEM Entreprise', 'onm2', 1, 1, 0, 187, 886, 3),
(3, 'INPP', 'inpp', 1, 1, 0, 187, 886, 5);


INSERT INTO `config_tax_item` (`id`, `config_tax_id`, `tax_id`, `payable`) VALUES
(1, 1, 1, NULL),
(2, 1, 2, NULL),
(3, 1, 3, NULL);


INSERT INTO `creditor_group` (`enterprise_id`, `uuid`, `name`, `account_id`, `locked`) VALUES
(200, '9a7f8879-9668-11e4-856d-00ffa8120072', 'Employees', 187, 0);


INSERT INTO `creditor` (`uuid`, `group_uuid`, `text`) VALUES
('0efaf497-a5b1-4c6d-b12c-d7945e1e6f82', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor [Niles]'),
('3006ad6a-9bfb-4c34-951b-6a76c1815580', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor [Mbayo]'),
('81b64ba6-e9f1-4f33-8ef9-5bfdc073c1ab', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor [Lomame]'),
('9a7f9d5d-9668-11e4-856d-00ffa8120072', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor for Employee A'),
('9a7fb21b-9668-11e4-856d-00ffa8120072', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor for Supplier A'),
('b638d8b7-4e1d-48d5-83b7-cd8db73a8c76', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor [Kitamuka]'),
('c61ecd3e-6283-46a4-9c57-4297894c8e94', '9a7f8879-9668-11e4-856d-00ffa8120072', 'Creditor [Foutain]');


INSERT INTO `debitor` (`uuid`, `group_uuid`, `text`) VALUES
('af902776-efd0-4aa8-ba5a-b7890117013b', '3a5f1868-471e-460b-879f-3ba22e8c03fe', 'Debitor [Niles]'),
('1535cc3f-c489-4810-83e4-9a4f37ffbe99', '3a5f1868-471e-460b-879f-3ba22e8c03fe', 'Debitor [Foutain]'),
('61573aad-c512-423b-ad3a-df96f662699a', '3a5f1868-471e-460b-879f-3ba22e8c03fe', 'Debitor [Mbayo]'),
('80e4f782-4c66-43e0-842b-4a5a26f8df60', '3a5f1868-471e-460b-879f-3ba22e8c03fe', 'Debitor [Lomame]'),
('9b74dcdb-11ed-444e-9dba-2829938f7eac', '3a5f1868-471e-460b-879f-3ba22e8c03fe', 'Debitor [Kitamuka]');


INSERT INTO `employee` (`id`, `code`, `prenom`, `name`, `postnom`, `sexe`, `dob`, `date_embauche`, `nb_spouse`, `nb_enfant`, `grade_id`, `daily_salary`, `bank`, `bank_account`, `adresse`, `phone`, `email`, `fonction_id`, `service_id`, `location_id`, `creditor_uuid`, `debitor_uuid`) VALUES
(1, '1001', 'Jonathan', 'Niles', 'jniles', 'M', '2000-01-01', '2000-01-01', 0, 0, @grade_uuid, 0, NULL, NULL, NULL, NULL, NULL, 1, NULL, '827082bb-7e3a-4966-8717-1cc5342548fd', '0efaf497-a5b1-4c6d-b12c-d7945e1e6f82', 'af902776-efd0-4aa8-ba5a-b7890117013b'),
(2, '1002', 'Steven', 'Foutain', 'Sfount', 'M', '2000-01-01', '2000-01-01', 0, 0, @grade_uuid, 0, NULL, NULL, NULL, NULL, NULL, 1, 2, '827082bb-7e3a-4966-8717-1cc5342548fd', 'c61ecd3e-6283-46a4-9c57-4297894c8e94', '1535cc3f-c489-4810-83e4-9a4f37ffbe99'),
(3, '1003', 'Bruce', 'Mbayo', 'Panda', 'M', '2000-01-01', '2000-01-01', 0, 0, @grade_uuid, 0, NULL, NULL, NULL, NULL, NULL, 1, NULL, '827082bb-7e3a-4966-8717-1cc5342548fd', '3006ad6a-9bfb-4c34-951b-6a76c1815580', '61573aad-c512-423b-ad3a-df96f662699a'),
(4, '1004', 'Chris', 'Lomame', 'Ch', 'M', '2000-01-01', '2000-01-01', 0, 0, @grade_uuid, 0, NULL, NULL, NULL, NULL, NULL, 1, NULL, '827082bb-7e3a-4966-8717-1cc5342548fd', '81b64ba6-e9f1-4f33-8ef9-5bfdc073c1ab', '80e4f782-4c66-43e0-842b-4a5a26f8df60'),
(5, '1005', 'Dedrick', 'Kitamuka', 'DedK', 'M', '2000-01-01', '2000-01-01', 0, 0, @grade_uuid, 0, NULL, NULL, NULL, NULL, NULL, 1, NULL, '827082bb-7e3a-4966-8717-1cc5342548fd', 'b638d8b7-4e1d-48d5-83b7-cd8db73a8c76', '9b74dcdb-11ed-444e-9dba-2829938f7eac');


INSERT INTO `fiscal_year` (`enterprise_id`, `id`, `number_of_months`, `fiscal_year_txt`, `transaction_start_number`, `transaction_stop_number`, `fiscal_year_number`, `start_month`, `start_year`, `previous_fiscal_year`, `locked`) VALUES
(200, 2, 12, 'FY 2015', NULL, NULL, NULL, 1, 2015, 1, 0);


INSERT INTO `period` (`id`, `fiscal_year_id`, `period_number`, `period_start`, `period_stop`, `locked`) VALUES
(14, 2, 0, '0000-00-00', '0000-00-00', 0),
(15, 2, 1, '2015-01-01', '2015-01-31', 0),
(16, 2, 2, '2015-02-01', '2015-02-28', 0),
(17, 2, 3, '2015-03-01', '2015-03-31', 0),
(18, 2, 4, '2015-04-01', '2015-04-30', 0),
(19, 2, 5, '2015-05-01', '2015-05-31', 0),
(20, 2, 6, '2015-06-01', '2015-06-30', 0),
(21, 2, 7, '2015-07-01', '2015-07-31', 0),
(22, 2, 8, '2015-08-01', '2015-08-31', 0),
(23, 2, 9, '2015-09-01', '2015-09-30', 0),
(24, 2, 10, '2015-10-01', '2015-10-31', 0),
(25, 2, 11, '2015-11-01', '2015-11-30', 0),
(26, 2, 12, '2015-12-01', '2015-12-31', 0);