use bhima;

set @group_uuid = UUID();
set @supplier_uuid = UUID();
set @employee_creditor_uuid = UUID();
set @supplier_creditor_uuid = UUID();

-- Oh lawd
set @location_uuid = (SELECT uuid from village where name = "TSHIKAJI");

insert into creditor_group values (200, @group_uuid, 'Employees', 187, 0);

insert into creditor values (@employee_creditor_uuid, @group_uuid, "Creditor for Employee A");
insert into creditor values (@supplier_creditor_uuid, @group_uuid, "Creditor for Supplier A");
insert into employee (code, name, dob, creditor_uuid) values ("0100", "Employee A", "1993-06-06", @employee_creditor_uuid);

insert into supplier (uuid, creditor_uuid, name, location_id, international, locked) values (@supplier_uuid, @supplier_creditor_uuid, "Supplier A", @location_uuid, 0, 0);

insert into depot (uuid, text, enterprise_id) values 
  (UUID(), "Warehouse", 200), 
  (UUID(), "Pharmacy 1", 200),
  (UUID(), "Pharmacy 2", 200);
