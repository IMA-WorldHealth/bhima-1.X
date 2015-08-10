// scripts/controllerstrialbalance.js

/*
 * The trial balance provides a description of what the general
 * ledger and balance sheet would look like after posting
 * data from the posting journal to the general ledger.  It also
 * submit errors back to the client.
 *
 * We perform various checks on the data to ensure that all
 * values are correct and present.  These checks include:
 *  1) Every transaction has an account [FATAL]
 *  2) Every account used is unlocked [FATAL]
 *  3) Every transaction has an currency [FATAL]
 *  4) Every transaction has a 0 balance (debits - credits, debit_equv - credit_equiv) [FATAL]
 *  5) Every transaction has the same fiscal year and period [FATAL]
 *  6) The fiscal year and period for each transaction is not in the future [FATAL]
 *  7) A deb_cred_type exists for each transaction with a deb_cred_uuid [FATAL]
 *  8) An exchange rate exists for each row/date in the transaction [WARNING]
 *  9) A doc_num exists for transactions involving a debtor/creditor [WARNING]
 *
 * If an error or warning is incurred, the controller responds
 * to the client with an 400 'Bad Request' status header.  The
 * body sent back is in the following format:
 * {
 *   affectedRows : 312,
 *   affectedTransactions : 16,
 *   errors : [{
 *     code : 'ERR_MISSING_ACCOUNT',
 *     fatal: true,
 *     rows : ['uuid1', 'uuid2'],
 *     details : 'Some rows are missing an account.'
 *   }, {
 *     code : 'ERR_TXN_IMBALANCE',
 *     fatal : true,
 *     rows: ['uuid1', 'uuid2']
 *     details : 'Some transactions do not balance.'
 *   }]
 * }
 *
 * If there is no error, we send back the trial balance report,
 * telling the state of the general ledger before the post and
 * after.
 */

var q = require('q'),
    db = require('../lib/db'),
    uuid = require('../lib/guid'),
    util = require('../lib/util');

// utility function to sum an array of objects
// on a particular property
function aggregate(property, array) {
  return array.reduce(function (s, row) {
    return s + row[property];
  }, 0);
}

// creates an error report for a given code
function createErrorReport(code, isFatal, rows) {
  return q({
    code : code,
    fatal : isFatal,
    transactions : rows.map(function (row) { return row.trans_id; }),
    affectedRows : aggregate('count', rows)
  });
}

// Ensure no accounts are locked in the transactions
function checkAccountsLocked(transactions) {
  var sql =
    'SELECT COUNT(pj.uuid) AS count, pj.trans_id ' +
    'FROM posting_journal AS pj LEFT JOIN account ' +
      'ON pj.account_id = account.id ' +
    'WHERE account.locked = 1 AND pj.trans_id IN (?) ' +
    'GROUP BY pj.trans_id;';

  return db.exec(sql, [transactions])
  .then(function (rows) {

    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('ERR_LOCKED_ACCOUNTS', true, rows);
  });
}

// make sure there are no missing accounts in the transactions
function checkMissingAccounts(transactions) {
  var sql =
    'SELECT COUNT(pj.uuid), pj.trans_id ' +
    'FROM posting_journal AS pj LEFT JOIN account ON ' +
      'pj.account_id = account.id ' +
    'WHERE pj.trans_id IN (?) AND account.id IS NULL ' +
    'GROUP BY pj.trans_id';

  return db.exec(sql, [transactions])
  .then(function (rows) {

    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('ERR_MISSING_ACCOUNTS', true, rows);
  });
}

// make sure dates are in their correct period
function checkDateInPeriod(transactions) {
  var sql =
    'SELECT COUNT(pj.uuid) AS count, pj.trans_id, pj.trans_date, p.period_start, p.period_stop ' +
    'FROM posting_journal AS pj JOIN period as p ON pj.period_id = p.id ' +
    'WHERE pj.trans_date NOT BETWEEN p.period_start AND p.period_stop AND ' +
      'pj.trans_id IN (?) ' +
    'GROUP BY pj.trans_id;';

  return db.exec(sql, [transactions])
  .then(function (rows) {
    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('ERR_DATE_IN_WRONG_PERIOD', true, rows);
  });
}

// make sure fiscal years and periods exist for all transactions
function checkPeriodAndFiscalYearExists(transactions) {
  var sql =
    'SELECT COUNT(pj.uuid) AS count, pj.trans_id ' +
    'FROM posting_journal AS pj ' +
    'WHERE pj.trans_id IN (?) AND (pj.period_id IS NULL OR pj.fiscal_year_id IS NULL) ' +
    'GROUP BY pj.trans_id;';

  return db.exec(sql, [transactions])
  .then(function (rows) {

    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('ERR_MISSING_FISCAL_OR_PERIOD', true, rows);
  });
}


// make sure the debit_equiv, credit_equiv are balanced
function checkTransactionsBalanced(transactions) {

  var sql =
    'SELECT COUNT(pj.uuid) AS count, pj.trans_id, SUM(pj.debit_equiv - pj.credit_equiv) AS balance ' +
    'FROM posting_journal AS pj ' +
    'WHERE pj.trans_id IN (?) ' +
    'GROUP BY trans_id HAVING balance <> 0;';

  db.exec(sql, [transactions])
  .then(function (rows) {

    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('ERR_UNBALANCED_TRANSACTIONS', true, rows);
  });
}

// make sure that a deb_cred_uuid exists for each deb_cred_type
function checkDebtorCreditorExists(transactions) {

  var sql =
    'SELECT COUNT(pj.uuid) AS count, pj.trans_id, pj.deb_cred_uuid FROM posting_journal AS pj ' +
    'WHERE pj.trans_id IN (?) AND (pj.deb_cred_type = \'D\' OR pj.deb_cred_type = \'C\') ' +
    'GROUP BY trans_id HAVING deb_cred_uuid IS NULL;';

  return db.exec(sql, [transactions])
  .then(function (rows) {

    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('ERR_MISSING_DEBTOR_CREDITOR', true, rows);
  });
}

// issue a warning if a transaction involving a debtor/creditor does not use a doc_num
function checkDocumentNumberExists(transactions) {
  var sql =
    'SELECT COUNT(pj.uuid) AS count, pj.doc_num, pj.trans_id, pj.deb_cred_uuid FROM posting_journal AS pj ' +
    'WHERE pj.trans_id IN (?) AND (pj.deb_cred_type = \'D\' OR pj.deb_cred_type = \'C\') ' +
    'GROUP BY pj.trans_id HAVING pj.doc_num IS NULL;';

  return db.exec(sql, [transactions])
  .then(function (rows) {

    // if nothing is returned, skip error report
    if (!rows.length) { return; }

    // returns a promise error report
    return createErrorReport('WARN_MISSING_DOCUMENT_ID', false, rows);
  });
}

// takes in an array of transactions and runs the trial
// balance checks on them,
function runAllChecks(transactions) {
  return q.all([
    checkAccountsLocked(transactions),
    checkMissingAccounts(transactions),
    checkDateInPeriod(transactions),
    checkPeriodAndFiscalYearExists(transactions),
    checkTransactionsBalanced(transactions),
    checkDebtorCreditorExists(transactions),
    checkDocumentNumberExists(transactions)
  ]);
}

//
function trialdashboard(transactions) {

}


/* GET /journal/trialbalance
 *
 * Performs the trial balance.
 *
 * Initially, the checks described at the beginning of the module are
 * performed to catch errors.  Even if errors or warnings are incurred,
 * the balance proceeds to report the total number of rows in the
 * trailbalance and other details.
 *
 * This report is sent back to the client for processing.
 *
 * NOTE: though a user may choose to ignore the errors presented
 * in the trial balance, the posting operation will block posting
 * to the general ledger if there are any 'fatal' errors.
*/

// Performs a trial balance
// Transaction ids are sent to the route in the query.
// e.g. ?transactions=HBB1,PAX2,HBB34,PAX356
exports.getTrialBalance = function (req, res, next) {
  'use strict';

  // parse the query string and retrieve the params
  var transactions = req.query.transactions.split(','),
      report = {};

  // run the database checks
  runAllChecks(transactions)
  .then(function (results) {

    // filter out the checks that passed
    // (they will be null/undefined)
    report.exceptions = results.filter(function (r) {
      return !!r;
    });

    // attempt to calculate a summary of the before, credit, debit, and after
    // state of each account in the posting journal
    var sql =
      'SELECT pt.debit, pt.credit, '  +
      'pt.account_id, pt.balance, account.account_number ' +
      'FROM  account JOIN ( ' +
        'SELECT SUM(debit_equiv) AS debit, SUM(credit_equiv) AS credit, ' +
        'posting_journal.account_id, (period_total.debit - period_total.credit) AS balance ' +
        'FROM posting_journal LEFT JOIN period_total ' +
        'ON posting_journal.account_id = period_total.account_id ' +
        'WHERE posting_journal.trans_id IN (?) ' +
        'GROUP BY posting_journal.account_id' +
        ') AS pt ' +
      'ON account.id=pt.account_id;';

    return db.exec(sql, [transactions]);
  })
  .then(function (summary) {

    console.log(summary);

    report.summary = summary;

    // trial balance succeeded!  Send back the resulting report
    //res.status(200).send(report);
  })
  .catch(function (error) {

    console.error(error.stack);

    // whoops.  Still have either errors or warnings. Make sure
    // that they are properly reported to the client.
    res.status(500).send(error);
  });
};

// POST /generalledger
// Posts data passing a valid trial balance to the general ledger
exports.postToGeneralLedger = function (req,res, next) {
  'use strict';

};


// TODO
function postToGeneralLedger (userId, key) {
  // Post data from the journal into the general ledger.
  var sql;

  // First thing we need to do is make sure that this posting request
  // is not an error and comes from a valid user.

  // Next, we need to generate a posting session id.
  sql =
    'INSERT INTO posting_session ' +
    'SELECT max(posting_session.id) + 1, ?, ? ' +
    'FROM posting_session;';

  db.exec(sql, [userId, new Date()])
  .then(function (res) {

    // Next, we must move the data into the general ledger.
    var sessionId = res.insertId;

    sql =
      'INSERT INTO general_ledger ' +
        '(project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, doc_num, ' +
        'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, comment, cost_ctrl_id, ' +
        'origin_id, user_id, cc_id, pc_id, session_id) ' +
      'SELECT project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, doc_num, ' +
        'description, account_id, debit, credit, debit_equiv, credit_equiv, currency_id, ' +
        'deb_cred_uuid, deb_cred_type,inv_po_id, comment, cost_ctrl_id, origin_id, user_id, cc_id, pc_id, ? ' +
      'FROM posting_journal;';
    return db.exec(sql, [sessionId]);
  })
  .then(function () {
    // Sum all transactions for a given period from the PJ
    // into period_total, updating old values if necessary.
    sql =
      'INSERT INTO period_total (account_id, credit, debit, fiscal_year_id, enterprise_id, period_id) ' +
      'SELECT account_id, SUM(credit_equiv) AS credit, SUM(debit_equiv) as debit , fiscal_year_id, project.enterprise_id, ' +
        'period_id FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
      'GROUP BY account_id ' +
      'ON DUPLICATE KEY UPDATE credit = credit + VALUES(credit), debit = debit + VALUES(debit);';
    return db.exec(sql);
  })
  .then(function () {
    // Finally, we can remove the data from the posting journal
    sql = 'DELETE FROM posting_journal WHERE 1;';
    return db.exec(sql);
  });
}
