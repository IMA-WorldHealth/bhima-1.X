-- written by jniles
-- Jan 7 2015

use bhima;

-- remove poorly labeled income accounts
update account as a JOIN account as b on a.id = b.id set a.account_type_id = 2 where b.account_type_id = 1;

-- set up income accounts as OHADA
update account as a JOIN account as b on a.id = b.id set a.account_type_id = 1 where b.account_type_id != 3 and b.account_number like '6%';
-- set up expense accounts as OHADA
update account as a JOIN account as b on a.id = b.id set a.account_type_id = 4 where b.account_type_id != 3 and b.account_number like '7%';
