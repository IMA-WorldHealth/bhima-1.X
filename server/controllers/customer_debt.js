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

	if (params.uuid && params.uuid !== '*') {

		debtorDebts(params.uuid, params.date)
		.then(function (ans) {
			res.status(200).send(ans);
		})
		.catch(next);

	} else {

		debtorGroupDebts(params.date)
		.then(function (ans) {
			res.status(200).send(ans);
		})
		.catch(next);

	}

}

function debtorDebts(id, untilDate) {
	var defer = q.defer();
	var glb = {};

	if (!id) { defer.reject(new Error('No debitor_group id selected!')); }

  var query =
    'SELECT `debitor_group`.`account_id` FROM `debitor_group` ' +
    ' WHERE `debitor_group`.`uuid`=?';

	db.exec(query, [id])
	.then(function (ans) {
	  var accountId = ans[0].account_id;
	  var query =
	    'SELECT c.inv_po_id, c.trans_id, c.trans_date, c.account_id FROM (' +
	      ' SELECT p.inv_po_id, p.trans_id, p.trans_date, p.account_id ' +
	      ' FROM posting_journal AS p ' +
	      ' WHERE p.account_id=? ' +
	      ' UNION ' +
	      ' SELECT g.inv_po_id, g.trans_date, g.trans_id, g.account_id ' +
	      ' FROM general_ledger AS g ' +
	      ' WHERE g.account_id=? ' +
	    ') AS c ;';

	  return db.exec(query, [accountId, accountId]);
	})
	.then(function (ans) {
	  if (!ans.length) { defer.resolve([]); }

	  glb.invoices = ans.map(function (line) {
	    return line.inv_po_id;
	  });

	  var dbQueries = [];
	  var accountId = ans[0].account_id;

	  glb.sqlTemplate =
	    'SELECT s.reference, s.is_distributable, t.project_id, t.inv_po_id, t.trans_date, SUM(t.debit_equiv) AS debit,  ' +
	      'SUM(t.credit_equiv) AS credit, SUM(t.debit_equiv - t.credit_equiv) as balance, ' +
	      't.account_id, t.deb_cred_uuid, t.currency_id, t.doc_num, t.description, t.account_id, ' +
	      't.comment, d.text, d.group_uuid, s.note, s.debitor_uuid, p.reference, pro.abbr ' +
	    'FROM (' +
	      '(' +
	        'SELECT pj.project_id, pj.inv_po_id, pj.trans_date, pj.debit, ' +
	          'pj.credit, pj.debit_equiv, pj.credit_equiv, ' +
	          'pj.account_id, pj.deb_cred_uuid, pj.currency_id, ' +
	          'pj.doc_num, pj.trans_id, pj.description, pj.comment ' +
	        'FROM posting_journal pj ' +
			    'WHERE (pj.inv_po_id IN ("' + glb.invoices.join('","') + '")) AND pj.account_id = ' + accountId + ' ' +
	      ') UNION ALL (' +
	        'SELECT gl.project_id, gl.inv_po_id, gl.trans_date, gl.debit, ' +
	          'gl.credit, gl.debit_equiv, gl.credit_equiv, ' +
	          'gl.account_id, gl.deb_cred_uuid, gl.currency_id, ' +
	          'gl.doc_num, gl.trans_id, gl.description, gl.comment ' +
	        'FROM general_ledger gl ' +
	        'WHERE (gl.inv_po_id IN ("' + glb.invoices.join('","') + '")) AND gl.account_id = ' + accountId + ' ' +
	      ')' +
	    ') AS `t` JOIN sale s ON t.inv_po_id = s.uuid ' +
	    'JOIN patient p ON p.debitor_uuid = s.debitor_uuid ' + 
	    'JOIN debitor d ON d.uuid = p.debitor_uuid ' + 
	    'JOIN project pro ON pro.id = t.project_id ' + 
	    'WHERE (%PERIOD%) ' +
	    'GROUP BY t.inv_po_id HAVING balance > 0 ;\n';

	  var untilDate = util.toMysqlDate(untilDate);

	  var requette1 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) <= 90');

		var requette2 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 91 AND 180');

		var requette3 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 181 AND 360');

		var requette4 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) > 360');

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
		console.log('More than a year : ', fourth);
	  defer.resolve(ans);
	})
	.catch(function (error) {
	  defer.reject(error);
	});

	return defer.promise;
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
	    'FROM (' +
	      '(' +
	        'SELECT pj.project_id, pj.inv_po_id, pj.trans_date, pj.debit, ' +
	          'pj.credit, pj.debit_equiv, pj.credit_equiv, ' +
	          'pj.account_id, pj.deb_cred_uuid, pj.currency_id, ' +
	          'pj.doc_num, pj.trans_id, pj.description, pj.comment ' +
	        'FROM posting_journal pj ' +
			    'WHERE pj.account_id IN (' + accountIds + ') ' +
	      ') UNION ALL (' +
	        'SELECT gl.project_id, gl.inv_po_id, gl.trans_date, gl.debit, ' +
	          'gl.credit, gl.debit_equiv, gl.credit_equiv, ' +
	          'gl.account_id, gl.deb_cred_uuid, gl.currency_id, ' +
	          'gl.doc_num, gl.trans_id, gl.description, gl.comment ' +
	        'FROM general_ledger gl ' +
	        'WHERE gl.account_id IN (' + accountIds + ')' +
	      ')' +
	    ') AS `t` ' +
	    'JOIN debitor_group dg ON dg.account_id = t.account_id ' + 
	    'WHERE (%PERIOD%) ' +
	    'GROUP BY t.account_id HAVING balance > 0 ;\n';

	  var untilDate = util.toMysqlDate(untilDate);

	  var requette1 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) <= 90');

		var requette2 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 91 AND 180');

		var requette3 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) BETWEEN 181 AND 360');

		var requette4 = glb.sqlTemplate.replace('%PERIOD%', 'DATEDIFF("' + untilDate + '", t.trans_date) > 360');

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
