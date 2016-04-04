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
		'SELECT v.name, v.id, s.uuid, s.service_id, s.note, s.invoice_date, SUM(s.cost) AS cost, s.currency_id, COUNT(s.uuid) AS nb_facture ' + 
		'FROM sale s ' + 
		'JOIN service v ON v.id = s.service_id ' +
		'WHERE s.uuid NOT IN (SELECT sale_uuid FROM credit_note) AND (s.invoice_date BETWEEN ? AND ?) ' + 
		'GROUP BY s.service_id';

	var dateFrom = util.toMysqlDate(req.query.dateFrom);
	var dateTo = util.toMysqlDate(req.query.dateTo);

	db.exec(requette, [dateFrom, dateTo])
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
		'GROUP BY s.uuid ';

	var dateFrom = util.toMysqlDate(req.query.dateFrom);
	var dateTo = util.toMysqlDate(req.query.dateTo);

	db.exec(requette, [req.params.id, dateFrom, dateTo])
	.then(function (rows) {
		res.status(200).send(rows);
	})
	.catch(next);
}