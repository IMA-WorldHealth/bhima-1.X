/* service status controller */
'use strict';

var q  = require('q'),
		db = require('../lib/db'),
		util = require('../lib/util');

module.exports.list = list;
module.exports.detail = detail;

/**
 * Get the list of service and their status
 */
function list(req, res, next) {
	var params, requette, glb = {};

	params = req.query;

	requette = 
		// 'SELECT v.name, v.id, s.uuid, s.service_id, s.note, s.invoice_date, SUM(s.cost) AS cost, s.currency_id, COUNT(s.uuid) AS nb_facture ' + 
		// 'FROM sale s ' + 
		// 'JOIN service v ON v.id = s.service_id ' +
		// 'WHERE s.uuid NOT IN (SELECT sale_uuid FROM credit_note) AND (s.invoice_date BETWEEN ? AND ?) ' + 
		// 'GROUP BY s.service_id';

		// 'select distinct SUM(credit_equiv - debit_equiv) as cost, t.service_id as id, t.uuid, t.name ' +
		// 'from  (' +
		// 	'select general_ledger.debit_equiv, general_ledger.credit_equiv, general_ledger.pc_id, v.name, s.uuid, s.service_id ' +
		// 	'from general_ledger ' +
		// 	'join account on account.id = general_ledger.account_id join account_type on account.account_type_id = account_type.id ' +
		// 	'join profit_center on profit_center.id = general_ledger.pc_id ' +
		// 	'join sale s on s.uuid = general_ledger.inv_po_id ' +
		// 	'join service v on v.id = s.service_id ' +
		// 	'where account_type_id = 1 AND s.uuid NOT IN (SELECT sale_uuid FROM credit_note) AND (general_ledger.trans_date BETWEEN ? AND ?) ' +
		// ') as t group by t.service_id;';

		'SELECT v.name, v.id, s.uuid, s.service_id, s.note, s.invoice_date, SUM(s.cost) AS cost, s.currency_id, COUNT(s.uuid) AS nb_facture ' + 
		'FROM sale s ' + 
		'JOIN service v ON v.id = s.service_id ' +
		'WHERE s.uuid NOT IN (SELECT sale_uuid FROM credit_note) AND (s.invoice_date BETWEEN ? AND ?) ' + 
		'AND s.uuid IN (SELECT gl.inv_po_id FROM general_ledger gl WHERE gl.trans_date BETWEEN ? AND ?) ' +
		'GROUP BY s.service_id';

	var dateFrom = util.toMysqlDate(req.query.dateFrom);
	var dateTo = util.toMysqlDate(req.query.dateTo);

	db.exec(requette, [dateFrom, dateTo, dateFrom, dateTo])
	.then(function (rows) {
		res.status(200).send(rows);
	})
	.catch(next);
}

/**
 * Get the detail of service
 */
function detail(req, res, next) {
	var params, requette;

	params = req.query;

	requette = 
		'SELECT v.name, v.id, s.uuid, s.service_id, s.note, s.cost, s.currency_id, s.invoice_date, CONCAT(p.abbr, s.reference) AS reference ' + 
		'FROM sale s JOIN project p ON p.id = s.project_id ' + 
		'JOIN service v ON v.id = s.service_id ' +
		'WHERE v.id = ? AND s.uuid NOT IN (SELECT sale_uuid FROM credit_note) AND (s.invoice_date BETWEEN ? AND ?) ' + 
		'AND s.uuid IN (SELECT gl.inv_po_id FROM general_ledger gl WHERE gl.trans_date BETWEEN ? AND ?) ' +
		'GROUP BY s.uuid ';

	var dateFrom = util.toMysqlDate(req.query.dateFrom);
	var dateTo = util.toMysqlDate(req.query.dateTo);

	db.exec(requette, [req.params.id, dateFrom, dateTo, dateFrom, dateTo])
	.then(function (rows) {
		res.status(200).send(rows);
	})
	.catch(next);
}