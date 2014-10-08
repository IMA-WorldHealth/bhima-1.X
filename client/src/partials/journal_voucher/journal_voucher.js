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

    // used in orderBy
    session.order = '+account_number';
    // used to select a deb/cred id
    session.type = 'd';

    function VoucherRow() {
      this.debit = null;
      this.credit = null;
      this.account_id = null;
      this.comment = '';
      this.selectEntity = false;
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
    };

    $scope.totalCredit = function () {
      session.totalCredit = total('credit');
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
      console.log(row);
    };
  }
]);
