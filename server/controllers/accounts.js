//TODO Refactor/define accounts API

var db = require('../lib/db');
var sanitize = require('../lib/sanitize');

// GET /accounts
exports.getAccounts = function (req, res, next) {
  'use strict';

  // TODO
  // This should probably take a query string for filtering to
  // make it more useful all around.
  // Some ideas: 
  // ?classe=5, ?type=ohada, etc...
  
  var sql =
    'SELECT a.id, a.account_number, a.account_txt, a.parent, at.type ' +
    'FROM account AS a JOIN account_type AS at ON ' +
      'a.account_type_id = at.id';

  if (req.query.type === 'ohada') {
    sql += ' WHERE a.is_ohada = 1;';
  }

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

// GET /account/:id
// FIXME/TODO
exports.getAccountById = function (req, res, next) {
  'use strict';
  
  var sql, id = req.param.id;

  sql =
    'SELECT a.id, a.account_number, a.account_text, a.parent, at.type ' +
    'FROM account AS a JOIN account_type AS at ON ' +
      'a.account_type_id = at.id ' +
    'WHERE a.id = ?;';
  
  db.exec(sql, [id])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};


// FIXME Moved from uncategorised - code must be refactored 
// --------------------------------------------------------
exports.listInExAccounts = function (req, res, next) {
  var enterprise_id = sanitize.escape(req.params.id_enterprise);
  var sql =
    'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, temp.`classe`, account_type.`type`, ' +
           'temp.`parent`, temp.`balance`' +  // , temp.`fixed`
    ' FROM (' +
        'SELECT account.id, account.account_number, account.account_txt, account.classe, account.account_type_id, ' +
               'account.parent, period_total.credit - period_total.debit as balance ' +  // account.fixed,
        'FROM account LEFT JOIN period_total ' +
        'ON account.id=period_total.account_id ' +
        'WHERE account.enterprise_id = ' + enterprise_id +
        ' AND (account.classe IN (\'6\', \'7\') OR ((account.classe IN (\'1\', \'2\', \'5\') AND account.is_used_budget = 1) ))' +
    ' ) ' +
    'AS temp JOIN account_type ' +
    'ON temp.account_type_id = account_type.id ' +
    'ORDER BY CAST(temp.account_number AS CHAR(10));';

  function process(accounts) {
    var InExAccounts = accounts.filter(function(item) {
      var account_6_7 = item.account_number.toString().indexOf('6') === 0 || item.account_number.toString().indexOf('7') === 0,
        account_1_2_5 = item.account_number.toString().indexOf('1') === 0 || item.account_number.toString().indexOf('2') === 0 || item.account_number.toString().indexOf('5') === 0;
      return account_6_7 || account_1_2_5;
    });
    return InExAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listEnterpriseAccounts = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.is_ohada = 1 ' +
      'AND account.cc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listEnterpriseProfitAccounts = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.is_ohada = 1 ' +
      'AND account.pc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listIncomeAccounts = function (req, res, next) {
  var sql ='SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE "6%" AND account_type_id <> "3"';

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listExpenseAccounts = function (req, res, next) {
  var sql ='SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE "7%" AND account_type_id <> "3"';
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

