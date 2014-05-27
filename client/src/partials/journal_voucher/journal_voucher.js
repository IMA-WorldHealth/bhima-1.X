angular.module('bhima.controllers')
.controller('journalVoucher', [
  '$scope',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'uuid',
  'util',
  'exchange',
  function ($scope, validate, connect, appstate, messenger, uuid, util, exchange) {
    var dependencies = {};
    var voucher = $scope.voucher = { rows : [] };
    var session = $scope.session = {};

    $scope.options = ['D', 'C'];

    $scope.today = new Date().toISOString().slice(0,10);

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt', 'account_type_id']
          }
        }
      }
    };

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol', 'min_monentary_unit']
          }
        }
      }
    };

    dependencies.debitors = {
      query : {
        tables : {
          'debitor' : {
            columns : ['uuid', 'text']
          }
        }
      }
    };

    function JournalRow () {
      this.id = Math.random();
      this.description = null;
      this.account = null;
      this.debit = 0;
      this.credit = 0;
      this.currency_id = null;
      this.deb_cred_uuid = null;
      this.deb_cred_type = null;
      this.inv_po_id = null;
      this.comment = null;
      this.origin = null;
      return this;
    }

    function init (model) {
      angular.extend($scope, model);

      $scope.accounts.data.forEach(function (account) {
        account.account_number = String(account.account_number);
      });

      voucher.currency_id = model.currencies.data[model.currencies.data.length-1].id;
      voucher.trans_date = util.convertToMysqlDate(new Date());
      voucher.rows = [new JournalRow(), new JournalRow()];

      connect.fetch('/max_trans/' + $scope.project.id)
      .then(function (ids) {
        var id = ids.pop();
        voucher.trans_id = id.increment ? id.abbr + id.increment : $scope.project.abbr + 1;
      });
    }

    $scope.submit = function submit() {
      // local variables to speed up calculation
      var prid, peid, fyid, description, transDate, invid, userId;
      prid = $scope.project.id;
      transDate = util.convertToMysqlDate(voucher.trans_date);
      invid = voucher.inv_po_id;
      description = voucher.description;

      // serialize date
      connect.fetch('/period/' + new Date(voucher.trans_date).valueOf())
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
          date           : voucher.trans_date,
          user_id        : userId
        };

        return connect.basicPut('journal_log', [log]);
      })
      .then(function () {
        messenger.success('Data posted successfully');
        flush();
      });
    };

    function flush (){
      voucher.rows = [new JournalRow(), new JournalRow()];
      voucher.description = null;
      voucher.inv_po_id = null;

      connect.fetch('/max_trans/' + $scope.project.id)
      .then(function (ids) {
        var id = ids.pop();
        voucher.trans_id = id.increment ? id.abbr + id.increment : $scope.project.abbr + 1;
      });
    }

    function calculateTotals () {
      var debitSom = 0, creditSom = 0;
      $scope.voucher.rows.forEach(function (item) {
        debitSom += item.debit;
        creditSom += item.credit;
      });

      $scope.voucher.debitTotal = debitSom;
      $scope.voucher.creditTotal = creditSom;
    }

    $scope.$watch('voucher.rows', function () {
      calculateTotals();

      var hasAccounts = voucher.rows.every(function (row) {
        return !!row.account_id;
      });

      var isBalanced = voucher.debitTotal === voucher.creditTotal;
      var nonZeroBalances = voucher.debitTotal + voucher.creditTotal !== 0;
      var nonDoubleEntry = voucher.rows.length >= 2;

      session.valid = hasAccounts && isBalanced && nonZeroBalances && nonDoubleEntry;
    }, true);

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + project.enterprise_id];

      validate.process(dependencies)
      .then(init)
      .catch(function (error) {
        messenger.danger('An error occured : ' + JSON.stringify(error));
        //console.error(error);
      });
    });

    $scope.addRow = function addRow () {
      voucher.rows.push(new JournalRow());
    };

    $scope.removeRow = function removeRow (index) {
      voucher.rows.splice(index, 1);
    };
  }
]);
