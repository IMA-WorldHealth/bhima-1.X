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

	db.exec(query)
	.then(function (ans) {
	  if (!ans.length) { defer.resolve([]); }

	  var accountIds = ans.map(function (line) {
	  	return line.account_id;
	  }).join(', '); 

	  var dbQueries = [];

	  glb.sqlTemplate =
	    'SELECT t.project_id, t.inv_po_id, t.trans_date, SUM(t.debit_equiv) AS debit,  ' +
		    'SUM(t.credit_equiv) AS credit, SUM(t.debit_equiv - t.credit_equiv) as balance, ' +
		    't.account_id, t.deb_cred_uuid, t.currency_id, t.doc_num, t.description, t.account_id, ' +
		    't.comment, dg.name, dg.uuid ' +
	    'FROM general_ledger t ' +
        'JOIN debitor_group dg ON dg.account_id = t.account_id ' + 
        'WHERE (%PERIOD%) ' +
	    'GROUP BY t.account_id HAVING balance > 0 ;\n';

	  if (!untilDate) {
	  	untilDate = util.toMysqlDate(new Date());
	  }

	  var requette1 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 0 AND 90) AND ("'+untilDate+'" >= t.trans_date)');
	  
		var requette2 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 91 AND 180) AND ("'+untilDate+'" >= t.trans_date)');
		
		var requette3 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 181 AND 360) AND ("'+untilDate+'" >= t.trans_date)');
		
		var requette4 = glb.sqlTemplate.replace(/%PERIOD%/g, '(DATEDIFF("' + untilDate + '", t.trans_date) > 360) AND ("'+untilDate+'" >= t.trans_date)');

	  dbQueries.push(db.exec(requette1));
	  dbQueries.push(db.exec(requette2));
	  dbQueries.push(db.exec(requette3));
	  dbQueries.push(db.exec(requette4));

	  return q.all(dbQueries);
	})
	.spread(function (first, second, third, fourth) {
		var ans = {
			first  : first,
			second : second, 
			third  : third, 
			fourth : fourth
		};
	  defer.resolve(ans);
	})
	.catch(function (error) {
	  defer.reject(error);
	});

	return defer.promise;
}

/**
 * @todo : implements a function to get details of a debtor group's debts 
 */

/**
function debtorGroupDetail(req, res, next) {
	var query, params, glb = {};

	params = req.query;


	query = 
		'SELECT t.project_id, t.inv_po_id, t.trans_date, t.debit_equiv, ' +
		    't.credit_equiv, t.debit_equiv - t.credit_equiv as balance, ' +
		    't.account_id, t.deb_cred_uuid, t.currency_id, t.doc_num, t.description, t.account_id, ' +
		    't.comment, dg.name, dg.uuid ' +
	    'FROM general_ledger t ' +
        'JOIN debitor_group dg ON dg.account_id = t.account_id ' + 
        'WHERE (%PERIOD%) AND account_id = ? ' +
	    'GROUP BY t.inv_po_id HAVING balance > 0 ;\n';

	if (!params.untilDate) {
  	params.untilDate = util.toMysqlDate(new Date());
  }

	query = query.replace(/%PERIOD%/g, 't.trans_date <= "' + params.untilDate + '"');

	db.exec(query, [params.account_id])
	.then(function (rows) {
		res.status(200).send(rows);
	})
	.catch(next);

} */

