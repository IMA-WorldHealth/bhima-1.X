angular.module('bhima.controllers')
.controller('journal.voucher', [
  '$scope',
  'validate',
  'connect',
  'appstate',
  'appcache',
  'messenger',
  'uuid',
  'util',
  'exchange',
  function ($scope, validate, connect, appstate, AppCache, messenger, uuid, util, exchange) {
    var dependencies = {},
        db = new AppCache('journal.voucher'),
        data = $scope.data = { rows : [] },
        session = $scope.session = {};

    if (!exchange.hasDailyRate()) {
      session.noExchange = true;
      return messenger.error('No Exchange Rate Detected!');
    }

    // used in orderBy
    session.order = '+account_number';

    function VoucherRow() {
      this.debit = null;
      this.credit = null;
      this.account_id = null;
      this.selectEntity = false;
      this.dctype = 'd';
    }

    data.rows = [new VoucherRow(), new VoucherRow()];

    // current timestamp
    data.date = new Date();

    dependencies.accounts = {
      required : true,
      query : {
        identifier : 'account_number',
        tables : {
          account : { columns : ['id', 'account_number', 'account_txt', 'account_type_id', 'fixed', 'parent'] },
          account_type : { columns : ['type'] }
        },
        join: ['account.account_type_id=account_type.id']
      },
    };

    dependencies.debtors = {
      query: {
        identifier : 'uuid',
        'tables' : {
          'debitor' : { 'columns' : ['uuid', 'text'] },
          'patient' : { 'columns' : ['first_name', 'last_name'] },
          'debitor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['debitor.uuid=patient.debitor_uuid', 'debitor_group.uuid=debitor.group_uuid', 'debitor_group.account_id=account.id']
      }
    };

    dependencies.creditors = {
      query: {
        'tables' : {
          'creditor' : { 'columns' : ['uuid', 'text'] },
          'creditor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['creditor.group_uuid=creditor_group.uuid','creditor_group.account_id=account.id']
      }
    };

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol']
          }
        }
      }
    };

    function startup(models) {
      var entities;
      models.accounts.data.forEach(function (account) {
        if (account.type === 'title') { account.disabled = true; }
        account.account_number = String(account.account_number);
      });

      // Hmmm...  Can we do better?
      entities = models.entities = [];
      models.debtors.data.forEach(function (debtor) {
        debtor.type = 'd';
        entities.push(debtor);
      });

      models.creditors.data.forEach(function (creditor) {
        creditor.type = 'c';
        entities.push(creditor);
      });

      angular.extend($scope, models);
    }

    $scope.submit = function submit() {
      // local variables to speed up calculation
      var records;
      
      // First step:
      // Get the periods associated for the date.
      connect.fetch('/period/' + Number(data.date))
      .then(function (period) {
        data.period_id = period.id;
        data.fiscal_year_id = period.fiscal_year_id;
        return connect.fetch('/user_session');
      })
      .then(function (user) {
        session.user_id = user.id;
        // FIXME : This is really bad in the long run.  If we scale to multiple
        // users, there is a chance a collision could take place and we
        // have duplicate transaction ids.
        return connect.fetch('/max_trans/' + $scope.project.id);
      })
      .then(function (transaction) {
        // FIXME : this should just return a simple number
        // or something.  transaction[0] looks ugly
        data.trans_id = transaction[0].abbr + transaction[0].increment;

        records = data.rows.map(function (row) {
          var record = {};

          record.uuid = uuid();
          record.trans_id = data.trans_id;
          record.description = data.description;
          record.project_id = $scope.project.id;
          record.trans_date = util.sqlDate(data.date);
          record.period_id = data.period_id;
          record.fiscal_year_id = data.fiscal_year_id;
         
          if (data.comment) { record.comment = data.comment; }
          if (data.document_id) { record.inv_po_id = data.document_id; }

          record.currency_id = data.currency_id;

          record.account_id = row.account_id;


          if (row.debit) {
            record.debit = row.debit;
            record.debit_equiv = exchange(row.debit, data.currency_id);
            record.credit = 0;
            record.credit_equiv = 0;
          }

          if (row.credit) {
            record.credit = row.credit;
            record.credit_equiv = exchange(row.credit, data.currency_id);
            record.debit = 0;
            record.debit_equiv = 0;
          }

          if (row.deb_cred_uuid) {
            record.deb_cred_uuid = row.deb_cred_uuid;
            record.deb_cred_type = row.deb_cred_type;
          }

          record.origin_id = 1; // FIXME
          record.user_id = session.user_id;

          return record;
        });

        console.log(records);

        return connect.basicPut('posting_journal', records);
      })
      .then(function () {
        var log = {
          uuid           : uuid(),
          transaction_id : data.trans_id,
          justification  : data.description,
          date           : util.sqlDate(data.trans_date),
          user_id        : session.user_id 
        };
        return connect.post('journal_log', log);
      })
      .then(function () {
        messenger.success('Data Posted Successfully.');
      })
      .catch(function (err) {
        console.error(err);
      })
      .finally();

      /*
      // serialize date
      connect.fetch('/period/' + new Date(data.trans_date).valueOf())
      .then(function (periods) {
        if (!periods.length) { throw new Error('No periods for that trans_id'); }
        var period = periods.pop();
        peid = period.id;
        fyid = period.fiscal_year_id;

        return connect.fetch('/user_session');
      })
      .then(function () {
        var records = [];
        userId = 1; // FIXME
        voucher.rows.forEach(function (row) {
          var record = {
            uuid           : uuid(),
            project_id     : prid,
            period_id      : peid,
            fiscal_year_id : fyid,
            trans_id       : voucher.trans_id,
            trans_date     : transDate,
            description    : description,
            account_id     : row.account_id,
            debit          : row.debit,
            credit         : row.credit,
            debit_equiv    : row.debit * exchange.rate(row.debit, voucher.currency_id),
            credit_equiv   : row.credit * exchange.rate(row.credit, voucher.currency_id),
            currency_id    : voucher.currency_id,
            deb_cred_uuid  : row.deb_cred_uuid,
            deb_cred_type  : row.deb_cred_type,
            inv_po_id      : invid,
            comment        : row.comment,
            origin_id      : 9,
            user_id        : userId,
          };
          records.push(record);
        });

        return connect.basicPut('posting_journal', records);
      })
      .then(function () {
        var log = {
          uuid           : uuid(),
          transaction_id : voucher.trans_id,
          justification  : voucher.description,
          date           : util.sqlDate(voucher.trans_date),
          user_id        : userId
        };

        return connect.basicPut('journal_log', [log]);
      })
      .then(function () {
        messenger.success('Data posted successfully');
      });
      */
    };

    // startup
    appstate.register('project', function (project) {
      $scope.project = project;
      data.currency_id = project.currency_id;
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(startup)
      .finally();
    });

    // totaler fn
    function total(column) {
      function sum(prev, next) { return prev + next[column]; }
      return data.rows.reduce(sum, 0);
    }

    $scope.totalDebit = function () {
      session.totalDebit = total('debit');
      session.validTotals = session.totalCredit === session.totalDebit && session.totalCredit !== 0;
    };

    $scope.totalCredit = function () {
      session.totalCredit = total('credit');
      session.validTotals = session.totalCredit === session.totalDebit && session.totalCredit !== 0;
    };

    $scope.remove = function (index) {
      data.rows.splice(index,1);
    };

    $scope.addRow = function () {
      data.rows.push(new VoucherRow());
      $scope.totalDebit();
      $scope.totalCredit();
    };

    $scope.selectDebCred = function (row) {
      var e = row.deb_cred;
      row.deb_cred_uuid = e.uuid;
      row.deb_cred_type = e.type === 'd' ?  'D' : 'C';
      row.account_id = $scope.accounts.get(e.account_number).id;
    };

    $scope.selectAccount = function (row) {
      delete row.deb_cred_uuid;
      delete row.deb_cred_type;
      row.account_id = row.account.id;
    };
  }
]);
