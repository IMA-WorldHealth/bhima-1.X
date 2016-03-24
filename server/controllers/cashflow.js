/* CASHFLOW controller */
'use strict';

var q  = require('q'),
		db = require('../lib/db');

module.exports = {
	liquidityReport : liquidityflowReport,
	cashReport      : cashFlowReport
};

/**
 * @function queryIncomeExpense 
 * @param {object} parameters 
 * @description returns incomes and expenses data in a promise
 */
function queryIncomeExpense (params, dateFrom, dateTo) {
	if (params && dateFrom && dateTo) {
		params.dateFrom = dateFrom;
		params.dateTo = dateTo;
	}

	var requette =
			'SELECT `t`.`uuid`, `t`.`trans_id`, `t`.`trans_date`, `a`.`account_number`, SUM(`t`.`debit_equiv`) AS debit_equiv,  ' +
			'SUM(`t`.`credit_equiv`) AS credit_equiv, SUM(`t`.`debit`) AS debit, SUM(`t`.`credit`) AS credit, `t`.`currency_id`, `t`.`description`, `t`.`comment`, `t`.`inv_po_id`, `o`.`service_txt`, `u`.`first`, `u`.`last` ' +
			'FROM (' +
				'(' +
					'SELECT `posting_journal`.`project_id`, `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit_equiv`, ' +
						'`posting_journal`.`credit_equiv`, `posting_journal`.`debit`, `posting_journal`.`credit`, `posting_journal`.`account_id`, `posting_journal`.`deb_cred_uuid`, '+
						'`posting_journal`.`currency_id`, `posting_journal`.`doc_num`, posting_journal.trans_id, `posting_journal`.`description`, `posting_journal`.`comment`, `posting_journal`.`origin_id`, `posting_journal`.`user_id` ' +
					'FROM `posting_journal` ' +
					'WHERE `posting_journal`.`account_id`= ? AND `posting_journal`.`trans_date` >= ? AND `posting_journal`.`trans_date` <= ? ' +
				') UNION ALL (' +
					'SELECT `general_ledger`.`project_id`, `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit_equiv`, ' +
						'`general_ledger`.`credit_equiv`, `general_ledger`.`debit`, `general_ledger`.`credit`, `general_ledger`.`account_id`, `general_ledger`.`deb_cred_uuid`, `general_ledger`.`currency_id`, ' +
						'`general_ledger`.`doc_num`, general_ledger.trans_id, `general_ledger`.`description`, `general_ledger`.`comment`, `general_ledger`.`origin_id`, `general_ledger`.`user_id` ' +
					'FROM `general_ledger` ' +
					'WHERE `general_ledger`.`account_id`= ? AND `general_ledger`.`trans_date` >= ? AND `general_ledger`.`trans_date` <= ? ' +
				')' +
			') AS `t`, account AS a, transaction_type as o, user as u WHERE `t`.`account_id` = `a`.`id` AND `t`.`origin_id` = `o`.`id` AND `t`.`user_id` = `u`.`id` ' + 
			'GROUP BY `t`.`trans_id` ;';

	return db.exec(requette, [params.account_id, params.dateFrom, params.dateTo, params.account_id, params.dateFrom, params.dateTo]);
}

/** liquidity flow report */
function liquidityflowReport (req, res, next) {
  var incomes, expenses, glb = {};
  var params = req.query;

  queryIncomeExpense(params)
	.then(handleResult)
	.then(function () {
		res.status(200).send(glb);
	})
  .catch(function (err) {
    return next(err);
  });

	function handleResult(results) {
		glb.incomes = results.filter(function (item) {
			return item.debit > 0;
		});
		glb.expenses = results.filter(function (item) {
			return item.credit > 0;
		});
		return glb;
	}
}

/** cash flow report */
function cashFlowReport (req, res, next) {
	var params = req.query;
	var glb = {};

	var currentDate = new Date();
	var currentYear = currentDate.getYear() + 1900;

	// get all periods for the the current fiscal year 
	fiscalYearPeriods(params.dateFrom, params.dateTo)
	.then(function (periods) {
		// get the closing balance (previous fiscal year) for the selected cashbox
		glb.periods = periods;
		return closingBalance(params.account_id, glb.periods[0].period_start);
	})
	.then(function (balance) {
		if (!balance.length) { balance[0] = { balance: 0, account_id: params.account_id }; }
		glb.openningBalance = balance[0];
		return queryIncomeExpense(params);
	})
	.then(function (result) {
		return groupingByMonth(glb.periods, result);
	})
	.then(incomeExpenseByPeriod)
	.then(function (flows) {
		res.status(200).send({ openningBalance : glb.openningBalance, flows : flows });
	})
	.catch(next);

}

/**
 * @function incomeExpense
 * @description This function help to separate incomes to expenses
 */
function incomeExpenseByPeriod(periodicFlows) {
	var grouping = [];
	periodicFlows.forEach(function (pf) {
		var incomes, expenses;
		incomes = pf.flows.filter(function (posting) {
			return posting.debit > 0;
		});
		expenses = pf.flows.filter(function (posting) {
			return posting.credit > 0;
		});
		grouping.push({ period: pf.period, incomes : incomes, expenses : expenses });
	});
	return grouping;
}

/**
 * @function groupingByMonth
 * @description This function help to group incomes or expenses by period
 */
function groupingByMonth(periods, flows) {
	var grouping = [];
	periods.forEach(function (p) {
		var data = [];
		flows.forEach(function (f) {
			var trans_date = new Date(f.trans_date);
			var period_start = new Date(p.period_start);
			var period_stop = new Date(p.period_stop);
			if (trans_date <= period_stop && trans_date >= period_start) {
				data.push(f);
			}
		});
		grouping.push({ period: p, flows : data });
	});
	return grouping;
}

/**
 * @function closingBalance 
 * @param {number} accountId An account for which we search to know the balance
 * @param {date} periodStart The first period start of a given fiscal year (current fiscal year)
 * @desc This function help us to get the balance at cloture for a set of accounts
 */
function closingBalance(accountId, periodStart) {
	var query =
    'SELECT SUM(`debit_equiv` - `credit_equiv`) as balance, `account_id` '+
    'FROM ' + 
    '(' +
	    '(' + 
	    	'SELECT `debit_equiv`, `credit_equiv`, `account_id`, `currency_id` ' + 
	    	'FROM `posting_journal` ' + 
	    	'WHERE `account_id` = ? AND `trans_date` < ? ' +
	    ') UNION ALL (' + 
	    	'SELECT `debit_equiv`, `credit_equiv`, `account_id`, `currency_id` ' + 
	    	'FROM `general_ledger` ' + 
	    	'WHERE `account_id` = ? AND `trans_date` < ? ' +
	    ')' + 
	  ') as `t` ' +
    'GROUP BY `account_id`';

  return db.exec(query, [accountId, periodStart, accountId, periodStart]);
}

/**
 * @function fiscalYearPeriods
 * @param {number} year A year for finding a corresponding fiscal year
 * @todo Find a better criteria for distinguish period successively than period_number
 */
function fiscalYearPeriods(dateFrom, dateTo) {
	var query = 
		'SELECT id, period_number, period_start, period_stop ' + 
		'FROM period WHERE period_start >= DATE(?) AND period_stop <= DATE(?)';
	return db.exec(query, [dateFrom, dateTo]);
}

/**
 * @function errorHandler 
 */
function errorHandler(err) {
	console.log(err);
}