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

    var isDefined = angular.isDefined;

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

      /*
      if (!exchange.hasDailyRate()) {
        session.noExchange = true;
        return messenger.danger('No exchange rate found!');
      }
      */

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

          if (row.deb_cred) {
            record.deb_cred_uuid = row.deb_cred.uuid;
            record.deb_cred_type = row.deb_cred.type.toUpperCase();
          } else {
            record.deb_cred_uuid = '';
            record.deb_cred_type = '';
          }

          record.origin_id = 1; // FIXME
          record.user_id = session.user_id;

          return record;
        });

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

    $scope.valid = function () {
      var hasMetaData = isDefined(data.description) &&
        isDefined(data.date) &&
        isDefined(data.currency_id);

      var hasValidRows = data.rows.every(function (row) {
        var validAmount, validAccount;

        validAmount =
          (row.debit > 0 && !row.credit) ||
          (!row.debit && row.credit > 0);

        validAccount = isDefined(row.deb_cred) || isDefined(row.account);

        return validAmount && validAccount;
      });

      return hasMetaData && hasValidRows && session.validTotals;
    };

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

    $scope.switchEntity = function (row) {
      // We are going from entity --> account
      delete row[row.selectEntity ? 'deb_cred' : 'account'];
      row.selectEntity = !row.selectEntity;
    };
  }
]);
