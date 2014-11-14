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
insert into employee (code, name, sexe, dob, nb_spouse, nb_enfant, grade_id, daily_salary, creditor_uuid, debitor_uuid) values ("0100", "Employee A", "M", "1993-06-06", 1, 1, @grade_uuid, 1.5,  @employee_creditor_uuid, @employee_debitor_uuid);

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

INSERT INTO `hollyday` VALUES
(1, 1, "vancances employe A", '2014-09-10', '2014-09-20');
