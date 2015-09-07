var q         = require('q'),
    core      = require('./core'),
    uuid      = require('../../lib/guid'),
    sanitize  = require('../../lib/sanitize'),
    validate  = require('../../lib/validate')(),
    db        = require('../../lib/db');

exports.close = close;
exports.extraPayment = extraPayment;
exports.create = create;

/*
 * Closes a fiscal year, migrating data over to the
 *
 *
 * FIXME - this route has been overloaded to do both opening
 * and closing a fiscal year.  We should really only ever do
 * one operation in the posting journal with one function...
 * This code is very difficult to test.
 *
 */
function close(id, user_id, data, cb) {
  'use strict';

  /*
  * param id : new fiscal year ID
  * param user_id : user ID
  * param data : useful data
  */

  var cfg = {},
      reference,
      resAccount = data.resultat_account,
      array6 = data.class6,
      array7 = data.class7,
      array8Charge = data.solde8Charge,
      array8Profit = data.solde8Profit,
      transactionDate,
      forcingDate;

  // FIXME - under what condition would forcing date be undefined?
  // What is forcing date?  Why make it a new date if it is undefined?
  if (typeof data.forcingDate === 'undefined' || data.forcingDate === null || !data.forcingDate) {
    forcingDate = new Date(data.forcingDate);
    cfg.isForClosing = false;
  } else {
    forcingDate = new Date(data.forcingDate);
    cfg.isForClosing = true;
  }

  function init() {
    cfg.user_id = user_id;
    cfg.project_id = 1; // HBB by default
    transactionDate = cfg.isForClosing ? forcingDate : new Date();
    return [
      core.queries.origin('journal'),
      core.queries.period(transactionDate)
    ];
  }

  init()
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(cfg.project_id);
  })
  .then(function (transId) {
    cfg.transId = '"' + transId + '"'; // FIXME - migrate to db.exec()
    if (cfg.isForClosing) {
      cfg.descrip =  'Locking Fiscal Year/' + String(transactionDate);
    } else {
      cfg.descrip =  'New Fiscal Year/' + new Date().toISOString().slice(0, 10).toString();
    }
  })
  .then(function () {
    return postingResultat(resAccount);
  })
  .then(function (res) {
    return cb(null, res);
  })
  .catch(cb)
  .done();


  function postingResultat (resAccount) {
    var processClass6 = array6.map(function (account6) {
      return processDebCred6(resAccount.id, account6);
    });

    var processClass7 = array7.map(function (account7) {
      return processDebCred7(resAccount.id, account7);
    });

    var processClass8Charge = array8Charge.map(function (account8c) {
      return processDebCred6(resAccount.id, account8c);
    });

    var processClass8Profit = array8Profit.map(function (account8p) {
      return processDebCred7(resAccount.id, account8p);
    });

    return q.all([processClass6, processClass7, processClass8Charge, processClass8Profit]);
  }

  function processDebCred6 (resultatAccount, class6Account) {
    var bundle = {
          class6Account : class6Account,
          solde         : class6Account.debit_equiv - class6Account.credit_equiv,
          currency_id   : class6Account.currency_id
        };

    if (bundle.solde > 0) {
      return q.all([debit(resultatAccount, bundle), credit(bundle.class6Account.id, bundle)]);
    } else if (bundle.solde < 0) {
      return q.all([debit(bundle.class6Account.id, bundle), credit(resultatAccount, bundle)]);
    }

    function debit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal (' +
        'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) '+
        'SELECT '+
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.transId, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            0, Math.abs(bundle.solde),
            0, Math.abs(bundle.solde),
            bundle.currency_id,
            'null'
          ].join(',') +
          ', null, ' +
          [
            'null',
            cfg.originId,
            cfg.user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }

    function credit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal ' +
        '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
        'SELECT ' +
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.transId, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            Math.abs(bundle.solde), 0,
            Math.abs(bundle.solde), 0,
            bundle.currency_id
          ].join(',') +
          ', null, null, ' +
          [
            'null',
            cfg.originId,
            user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }
  }

  function processDebCred7 (resultatAccount, class7Account) {
    var bundle = {
          class7Account : class7Account,
          solde         : class7Account.credit_equiv - class7Account.debit_equiv,
          currency_id   : class7Account.currency_id
        };

    if (bundle.solde > 0) {
      return q.all([debit(bundle.class7Account.id, bundle), credit(resultatAccount, bundle)]);
    } else if (bundle.solde < 0) {
      return q.all([debit(resultatAccount, bundle), credit(bundle.class7Account.id, bundle)]);
    }

    function debit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal '+
        '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) '+
        'SELECT '+
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.transId, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            0, Math.abs(bundle.solde),
            0, Math.abs(bundle.solde),
            bundle.currency_id,
            'null'
          ].join(',') +
          ', null, ' +
          [
            'null',
            cfg.originId,
            cfg.user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }

    function credit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal (' +
        'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
        'SELECT ' +
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.transId, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            Math.abs(bundle.solde), 0,
            Math.abs(bundle.solde), 0,
            bundle.currency_id
          ].join(',') +
          ', null, null, ' +
          [
            'null',
            cfg.originId,
            user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }
  }
}

/* Extra Payment
 *
 * For doing extra things (tm).
*/
function extraPayment(id, userId, details, cb) {
  'use strict';

  var sql, params, rate, data, reference, cfg = {};

  sql =
    'SELECT g.account_id ' +
    'FROM sale ' +
    'JOIN debitor AS d ON d.uuid = sale.debitor_uuid ' +
    'JOIN debitor_group AS g ON g.uuid = d.group_uuid ' +
    'WHERE sale.uuid = ?;';

  db.exec(sql, [details.sale_uuid])
  .then(function (records) {
    if (records.length === 0) {
      throw new Error('Could not find sale with uuid:' +  details.sale_uuid);
    }
    reference = records[0];

    // FIXME - why is this necessary?  The client should only send numbers!
    details.cost = parseFloat(details.cost);
    return [
      core.queries.origin('journal'),
      core.queries.period(new Date()),
      core.queries.exchangeRate(new Date())
    ];
  })
  .spread(function (originId, periodObject, store) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(details.currency_id).rate;
    return core.queries.transactionId(details.project_id);
  })
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description =  transId.substring(0,4) + '_Extra_Payment/' + new Date().toISOString().slice(0, 10).toString();
    sql =
      'INSERT INTO posting_journal (' +
        'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'VALUES (?);';

    params = [
      uuid(), details.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(),
      cfg.description, details.wait_account, 0, details.cost, 0, details.cost / rate, details.currency_id,
      details.debitor_uuid, 'C', details.sale_uuid, cfg.originId, details.user_id
    ];

    return db.exec(sql, params);
  })
  .then(function () {
    sql =
      'INSERT INTO posting_journal (' +
        'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'VALUES (?);';

    params = [
      uuid(), details.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(),
      cfg.description, reference.account_id, details.cost, 0, details.cost / rate, 0,
      details.currency_id, details.debitor_uuid, 'D', details.sale_uuid, cfg.originId,
      userId
    ];

    return db.exec(sql, params);
  })
  .then(function (res) {
    return cb(null, res);
  })
  .catch(cb)
  .done();
}

/* Create
 *
 * Create fiscal year, which involves the posting journal
 * for some reason...
*/
function create(id, userId, details, cb) {
  'use strict';

  var sql, rate, queries, cfg = {},
      ids = [];

  q([
    core.queries.origin('journal'),
    core.queries.period(new Date()),
    core.queries.exchangeRate(new Date())
  ])
  .spread(function (originId, periodObject, store) {
    cfg.balance = details[0];
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(cfg.balance.currencyId).rate;
    return core.queries.transactionId(cfg.balance.projectId);
  })
  .then(function (transId) {

    queries = details.map(function (balance) {
      var params, uid = uuid();
      ids.push(uid);

      sql =
        'INSERT INTO posting_journal (' +
          'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, origin_id, user_id) ' +
        'VALUES (?);';

      params = [
        uid, balance.projectId, cfg.fiscalYearId, cfg.periodId, transId, new Date(),
        cfg.description, balance.accountId, balance.credit, balance.debit,
        balance.credit / rate, balance.debit / rate, balance.currencyId, cfg.originId,
        userId
      ];

      return db.exec(sql, params);
    });

    return q.all(queries);
  })
  .then(function (res) {
    cb(null, res);
  })
  .catch(function (err) {
    sql = ids.length > 0 ? 'DELETE FROM posting_journal WHERE posting_journal.uuid IN (?);' : 'SELECT 1 + 1;';

    db.exec(sql, [ids])
    .finally(function () {
      cb(err);
    });
  })
  .done();
}
