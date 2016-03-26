/**
 * Customers Debts Controllers 
 */
'use strict';

var q  = require('q'),
		db = require('../lib/db');

module.exports.periodicDebts = periodicDebts;

/**
 * This function is responsible to returns the periodic debts of debtors
 */
function periodicDebts(req, res, next) {
	var requette, params, uuidArray, glb = {};

	params = req.query;

	requette = 'SELECT d.uuid FROM debitor d WHERE d.group_uuid = ?';
	db.exec(requette, [params.uuid])
	.then(function (rows) {

		var dbQueries = [];

		/** @fixme : Query need a fixation for getting Debts of clients */
		glb.sqlTemplate = 
			'SELECT t.trans_id, t.trans_date, ' +
				'SUM(t.debit_equiv - t.credit_equiv) AS balance, ' + 
				't.currency_id, t.inv_po_id, t.deb_cred_uuid, t.note, t.debitor_uuid, d.group_uuid, d.text ' + 
			'FROM (' + 
				'SELECT pj.trans_id, pj.trans_date, pj.debit, pj.debit_equiv, pj.credit, pj.credit_equiv, pj.currency_id, pj.inv_po_id, pj.deb_cred_uuid, s.note, s.debitor_uuid ' + 
					'FROM posting_journal pj ' + 
					'JOIN sale s ON s.uuid = pj.inv_po_id ' +
				'WHERE %PJ_PERIOD% ' + 
					' UNION ALL ' +
				'SELECT gl.trans_id, gl.trans_date, gl.debit, gl.debit_equiv, gl.credit, gl.credit_equiv, gl.currency_id, gl.inv_po_id, gl.deb_cred_uuid, s.note, s.debitor_uuid ' + 
					'FROM general_ledger gl ' + 
					'JOIN sale s ON s.uuid = gl.inv_po_id ' +
				'WHERE %GL_PERIOD% ' + 
			') AS t, debitor d ' + 
			'WHERE d.uuid = t.debitor_uuid AND d.group_uuid = ? ' +
			'GROUP BY t.debitor_uuid HAVING balance > 0 ;';

		// return first quarter 
		var requette1 = glb.sqlTemplate.replace('%PJ_PERIOD%', 'DATEDIFF(NOW(), pj.trans_date) <= 90');
				requette1 = requette1.replace('%GL_PERIOD%', 'DATEDIFF(NOW(), gl.trans_date) <= 90');
		return db.exec(requette1, [params.uuid]);
	})
	.then(function (first) {
		glb.first = first;
		// second quarter 
		var requette2 = glb.sqlTemplate.replace('%PJ_PERIOD%', 'DATEDIFF(NOW(), pj.trans_date) BETWEEN 91 AND 180');
				requette2 = requette2.replace('%GL_PERIOD%', 'DATEDIFF(NOW(), gl.trans_date)  BETWEEN 91 AND 180');
		return db.exec(requette2, [params.uuid]);
	})
	.then(function (second) {
		glb.second = second;
		// third quarter 
		var requette3 = glb.sqlTemplate.replace('%PJ_PERIOD%', 'DATEDIFF(NOW(), pj.trans_date) BETWEEN 181 AND 360');
				requette3 = requette3.replace('%GL_PERIOD%', 'DATEDIFF(NOW(), gl.trans_date)  BETWEEN 181 AND 360');
		return db.exec(requette3, [params.uuid]);
	})
	.then(function (third) {
		glb.third = third;
		// last quarter 
		var requette4 = glb.sqlTemplate.replace('%PJ_PERIOD%', 'DATEDIFF(NOW(), pj.trans_date) > 360');
				requette4 = requette4.replace('%GL_PERIOD%', 'DATEDIFF(NOW(), gl.trans_date) > 360');
		console.log(requette4);
		return db.exec(requette4, [params.uuid]);
	})
	.then(function (fourth) {
		glb.fourth = fourth;
		var result = { first: glb.first, second: glb.second, third: glb.third, fourth: glb.fourth };
		res.status(200).send(result);
	})
	.catch(next);
}