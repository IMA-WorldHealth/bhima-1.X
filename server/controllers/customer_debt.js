/**
 * Customers Debts Controllers 
 */
'use strict';

var q  = require('q'),
		db = require('../lib/db'),
		util = require('../lib/util');

module.exports.periodicDebts = periodicDebts;

/**
 * This function is responsible to returns the periodic debts of debtors
 */
function periodicDebts(req, res, next) {
	var requette, params, uuidArray, glb = {};

	params = req.query;

	debtorGroupDebts(params.date)
	.then(function (ans) {
		res.status(200).send(ans);
	})
	.catch(next);

}


function debtorGroupDebts(untilDate) {
	var defer = q.defer();
	var glb = {};

  var query = 'SELECT `debitor_group`.`account_id` FROM `debitor_group`' ;

  getFiscalYear(untilDate)
  .then(function (rows) {
  	glb.fiscalYear = rows[0];
  	return db.exec(query);
  })
	.then(function (ans) {
	  if (!ans.length) { defer.resolve([]); }

	  var accountIds = ans.map(function (line) {
	  	return line.account_id;
	  }).join(', '); 

	  var dbQueries = [];

	  var previousDebts = 
	  	'SELECT t.project_id, t.inv_po_id, t.trans_date, SUM(t.debit_equiv) AS debit,  ' +
		    'SUM(t.credit_equiv) AS credit, SUM(t.debit_equiv - t.credit_equiv) as balance, ' +
		    't.account_id, t.deb_cred_uuid, t.currency_id, t.doc_num, t.description, t.account_id, ' +
		    't.comment, dg.name, dg.uuid ' +
	    'FROM general_ledger t ' +
        'JOIN debitor_group dg ON dg.account_id = t.account_id ' + 
        'WHERE t.fiscal_year_id = ? ' +
	    'GROUP BY t.account_id HAVING balance <> 0 ;\n';

	  glb.sqlTemplate =
	    'SELECT t.project_id, t.inv_po_id, t.trans_date, SUM(t.debit_equiv) AS debit,  ' +
		    'SUM(t.credit_equiv) AS credit, SUM(t.debit_equiv - t.credit_equiv) as balance, ' +
		    't.account_id, t.deb_cred_uuid, t.currency_id, t.doc_num, t.description, t.account_id, ' +
		    't.comment, dg.name, dg.uuid ' +
	    'FROM general_ledger t ' +
        'JOIN debitor_group dg ON dg.account_id = t.account_id ' + 
        'WHERE (%PERIOD%) ' +
	    'GROUP BY t.account_id HAVING balance <> 0 ;\n';

	  if (!untilDate) {
	  	untilDate = util.toMysqlDate(new Date());
	  }

	  var requette1 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 0 AND 90) AND ("'+untilDate+'" >= t.trans_date) AND t.fiscal_year_id = ?');
	  
		var requette2 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 91 AND 180) AND ("'+untilDate+'" >= t.trans_date) AND t.fiscal_year_id = ?');
		
		var requette3 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 181 AND 366) AND ("'+untilDate+'" >= t.trans_date) AND t.fiscal_year_id = ?');

		dbQueries.push(db.exec(previousDebts, [glb.fiscalYear.previous_fiscal_year]));
	  dbQueries.push(db.exec(requette1, [glb.fiscalYear.id]));
	  dbQueries.push(db.exec(requette2, [glb.fiscalYear.id]));
	  dbQueries.push(db.exec(requette3, [glb.fiscalYear.id]));

	  return q.all(dbQueries);
	})
	.spread(function (previous, first, second, third) {
		var ans = {
			first  : first,
			second : second, 
			third  : third, 
			fourth : previous
		};
	  defer.resolve(ans);
	})
	.catch(function (error) {
	  defer.reject(error);
	});

	return defer.promise;
}

/**
 * @function fiscalYear
 * @param {date} year A year for finding a corresponding fiscal year
 * @todo Find a better criteria for distinguish period successively than period_number
 */
function getFiscalYear(untilDate) {
	if (!untilDate) {
  	untilDate = util.toMysqlDate(new Date());
  }
	var query = 
		'SELECT fy.id, fy.previous_fiscal_year FROM fiscal_year fy ' + 
		'JOIN period p ON p.fiscal_year_id = fy.id ' + 
		'WHERE ? BETWEEN p.period_start AND p.period_stop';
	return db.exec(query, [untilDate]);
}

