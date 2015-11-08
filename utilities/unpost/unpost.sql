
-- this table will store the trans_ids from the general_ledger
-- temporarily
CREATE TEMPORARY TABLE gl2pj (
  trans_id text NOT NULL
);

-- populate the temporary table
INSERT INTO gl2pj SELECT DISTINCT trans_id from general_ledger;

-- unpost data from the general ledger
INSERT INTO posting_journal
  SELECT uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, doc_num, description, account_id, debit, credit, debit_equiv,
  credit_equiv, currency_id, deb_cred_uuid , deb_cred_type, inv_po_id, comment, cost_ctrl_id, origin_id, posting_session.user_id, cc_id, pc_id
FROM general_ledger JOIN posting_session ON general_ledger.session_id = posting_session.id;

-- remove old/invalid data
DELETE FROM period_total;
DELETE FROM general_ledger;
DELETE FROM posting_session;

-- correct the unposted data's period id/trans_date discrepency
UPDATE posting_journal SET period_id = (SELECT period.id FROM period WHERE trans_date BETWEEN period.period_start AND period.period_stop)
WHERE trans_id IN (SELECT trans_id FROM gl2pj);

-- run the period totals calculation
INSERT INTO period_total (account_id, credit, debit, fiscal_year_id, enterprise_id, period_id)
SELECT account_id, SUM(credit_equiv) AS credit, SUM(debit_equiv) as debit , fiscal_year_id, project.enterprise_id,
  period_id FROM posting_journal JOIN project ON posting_journal.project_id = project.id
  WHERE trans_id IN (SELECT trans_id FROM gl2pj)
GROUP BY period_id, account_id
ON DUPLICATE KEY UPDATE credit = credit + VALUES(credit), debit = debit + VALUES(debit);

-- create a new posting_session record (id = 1, user id  = 1)
INSERT INTO posting_session VALUES (1, 1, CURRENT_DATE());

-- POST to the general ledger
INSERT INTO general_ledger
  (project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, doc_num,
  description, account_id, debit, credit, debit_equiv, credit_equiv,
  currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, comment, cost_ctrl_id,
  origin_id, user_id, cc_id, pc_id, session_id)
SELECT project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, doc_num,
  description, account_id, debit, credit, debit_equiv, credit_equiv, currency_id,
  deb_cred_uuid, deb_cred_type,inv_po_id, comment, cost_ctrl_id, origin_id, user_id, cc_id, pc_id, 1
FROM posting_journal WHERE trans_id IN (SELECT trans_id FROM gl2pj);

-- delete data we unposted from the posting_journal
DELETE FROM posting_journal WHERE trans_id in (SELECT trans_id FROM gl2pj);

-- drop the temporary table
DROP TABLE gl2pj;
