-- Deleting diplication for MSH debtor group
-- Dedrick Kitamuka
-- 03-04-2016

update debitor set group_uuid = "1c38dd69-db99-486f-982f-590906e9bbae" where group_uuid="605eb536-9220-4141-abef-c59839fa566d";

delete from debitor_group_history where debitor_group_uuid="605eb536-9220-4141-abef-c59839fa566d";

delete from debitor_group where uuid="605eb536-9220-4141-abef-c59839fa566d";

