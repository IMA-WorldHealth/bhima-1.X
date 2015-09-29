/* Budget controller */
'use strict';

var csv  = require('fast-csv'),
		fs   = require('fs'),
		db   = require('../lib/db');

var uploadDir = 'client/upload/';

module.exports = {
	upload : uploadedFile
};

function uploadedFile(req, res, next) {
	/*
		* Objectif : handling the uploaded file and generate an array (csvArray) from the file
	*/
	var csvArray = [];
	var file = req.files.file;
	var fiscal_year_id = req.body.fiscal_year_id;
	var period = JSON.parse(req.body.period);

	if (file && file.path && file.name) {
		var fileName = uploadDir + file.name.replace(/ /g, '_');

		// File name can be more readable
		fs.rename(file.path, fileName, function (err) {
			if (err) { throw err; }
			fs.stat(fileName, function (err, stat) {
				if (err) { throw err; }
				csv.fromPath(fileName, {headers: true})
				.on('data', function (data) {
					csvArray.push(data);
				})
				.on('end', function () {
					createBudget(csvArray, fiscal_year_id, period);
					res.status(200).send('uploaded');
				});
			});
		});
	} 
}

function createBudget(csvArray, fiscal_year_id, period) {

	/*
		* Objectif : create a new budget via params given
		* Params : 
		*	- csvArray : an array of the budget csv file
		* - fiscal_year_id : the fiscal year id
		* - period : the period
	*/

	if (csvArray.length) {

		if (period.period_number === 0) {
			// Budget for the fiscal year
			var queryPeriods = 'SELECT period.id, period.period_number FROM period WHERE period.fiscal_year_id = ? ';
			db.exec(queryPeriods, [fiscal_year_id])
			.then(function (data) {
				var periodIds = data;
				var periodLength = periodIds.length - 1 > 0 ? periodIds.length - 1 : 1;
				periodIds.forEach(function (item) {
					if (item.period_number !== 0) {
						csvArray.forEach(function (acc) {
							// Hack for performance : Number(acc.Budget) !== 0 skip default budget=0
							// If we choose to set a budget to zero in csv file, it's will be impossible to import it
							if (acc.Type !== 'title' && Number(acc.Budget) !== 0 && !isNaN(Number(acc.Budget))) {
								var sql = 'INSERT INTO `budget` (account_id, period_id, budget) VALUES (?, ?, ?) ;';
								var value = [acc.AccountId, item.id, acc.Budget/periodLength];
								clearPreviousBudgets(item.id)
								.then(function () {
									db.exec(sql, value);
								});
							}
						});
					}
				});
			});

		} else if (period.period_number >= 1 && period.period_number <= 12) {
			// Budget for a particular period in fiscal year
			csvArray.forEach(function (item) {
				if (item.Type !== 'title' && Number(item.Budget) !== 0 && !isNaN(Number(item.Budget))) {
					var sql = 'INSERT INTO `budget` (account_id, period_id, budget) VALUES (?, ?, ?) ;';
					var value = [item.AccountId, period.id, item.Budget];
					clearPreviousBudgets(period.id)
					.then(function () {
						db.exec(sql, value);
					});
				}
			});

		} 
	}

	function clearPreviousBudgets(period_id) {
		// remove all previous budgets for the fiscal_year or period given
		// because in budget analyse module we have the sum of all
		var sql = 'DELETE FROM budget WHERE period_id = ? ;';
		return db.exec(sql, [period_id]);
	}
}
