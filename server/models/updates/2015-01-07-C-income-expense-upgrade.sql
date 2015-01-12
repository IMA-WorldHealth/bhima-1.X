-- written by jniles
-- Jan 7 2015

use bhima;

-- migrate old data
UPDATE account_type SET `type` = 'income' WHERE id = 1;
INSERT INTO account_type VALUES (4, 'expense');

-- remove poorly labeled income accounts
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 2 WHERE b.account_type_id = 1;

-- SET up income accounts AS OHADA
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 1 WHERE b.account_type_id != 3 and b.account_number like '6%';

-- SET up expense accounts AS OHADA
UPDATE account AS a JOIN account AS b ON a.id = b.id SET a.account_type_id = 4 WHERE b.account_type_id != 3 and b.account_number like '7%';
