angular.module('kpk.controllers')
.controller('cash', [
  '$scope',
  '$location',
  '$translate',
  'connect',
  'appstate',
  'messenger',
  'validate',
  'exchange',
  'kpkUtilitaire',
  'precision',
  'totaler',
  function($scope, $location, $translate, connect, appstate, messenger, validate, exchange, util, precision, totaler) {
    var dependencies = {},
        data = $scope.data = {};

    $scope.queue = [];
    data.payment = 0;
    data.total = 0;
    data.raw = 0;
   
    dependencies.debitors = {
      query : {
        tables: {
          'patient' : {
            columns: ['first_name', 'last_name']
          },
          'debitor' : {
            columns: ['id']
          },
          'debitor_group' : {
            columns: ['name', 'account_id', 'max_credit']
          },
          'account' : {
            columns: ['account_number']
          }
        },
        join: [
          'patient.debitor_id=debitor.id',
          'debitor.group_id=debitor_group.id',
          'debitor_group.account_id=account.id'
        ],
        where: ['debitor_group.locked<>1']
      }
    };

    dependencies.cashboxes = {
      query : {
        tables : {
          'currency_account' : {
            columns : ['id', 'enterprise_id', 'currency_id', 'cash_account', 'bank_account']
          },
          'currency' : {
            columns : ['symbol']
          }
        },
        join : ['currency_account.currency_id=currency.id'],
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        },
      }
    };

    dependencies.cash = {
      query : {
        tables: {
          'cash' : {
            columns: ['id', 'bon', 'bon_num', 'date', 'debit_account', 'credit_account', 'currency_id', 'cashier_id', 'cost', 'description']
          }
        }
      }
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.cashboxes.query.where =
        ['currency_account.enterprise_id=' + enterprise.id];
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + enterprise.id];
      validate.process(dependencies).then(setUpModels, handleErrors);
    });


    function setUpModels(models) {
      for (var k in models) {
        $scope[k] = models[k];
      }
      $scope.cashbox = $scope.cashboxes.get($scope.enterprise.currency_id);
      $scope.queue = [];
    }

    function handleErrors(error) {
      messenger.danger('Error:', JSON.stringify(error));
    }

    $scope.setCashBox = function setCashBox (box) {
      $scope.cashbox = box;
    };

    $scope.loadInvoices = function (debitor) {
      $scope.ledger = [];
      $scope.debitor = debitor;
      $scope.queue = [];
      connect.fetch('/ledgers/debitor/' + debitor.id)
        .success(function (data) {
          data.forEach(function (row) {
            row.debitor = [debitor.first_name, debitor.last_name].join(' ');
          });

          $scope.ledger = data.filter(function (row) {
            return row.balance > 0;
          });

          // hack to process currency locales
          $scope.cashbox = $scope.cashboxes.get($scope.enterprise.currency_id);

        })
        .error(function (err) {
          messenger.danger('An error occured:' + JSON.stringify(err));
        });
    };

    $scope.add = function (idx) {
      var invoice = $scope.ledger.splice(idx, 1)[0];
      invoice.allocated = 0;
      $scope.queue.push(invoice);
    };

    $scope.remove = function (idx) {
      $scope.ledger.push($scope.queue.splice(idx, 1)[0]);
    };

    function addTotal(n, m) {
      return precision.round(n + m.locale);
    }

    $scope.digestTotal = function () {
      data.raw = $scope.queue.reduce(addTotal, 0);
      if (!$scope.cashbox) { return; }
      var o = totaler(data.raw, $scope.cashbox.currency_id);
      console.log('o is:', o);
      data.total = o.total;

      // digest overdue
      var over  = data.payment - data.total;
      data.overdue = over > 0 ? over : 0;
    };

    $scope.digestInvoice = function () {
      if (!$scope.queue) { return; }

      var proposed = $scope.data.payment || 0;

      $scope.queue.forEach(function (invoice) {
        if (proposed < 0) {
          invoice.allocated = 0;
          return;
        }

        var diff = precision.round(proposed - invoice.locale);
        if (diff >= 0) {
          proposed = diff;
          invoice.allocated = invoice.locale;
        } else {
          invoice.allocated = proposed;
          proposed = 0;
        }
        invoice.remaining = precision.compare(invoice.locale, invoice.allocated);
      });

      var over  = data.payment - data.total;
      data.overdue = over > 0 ? over : 0;

    };


    function processCashInvoice () {
      // Gather data and submit the cash invoice
      var bon_num, cashPayment, date, description;

      date = util.convertToMysqlDate(new Date());

      bon_num = generateBonNumber($scope.cash.data, 'E');

      description = ['CP E', bon_num, $scope.debitor.first_name, date].join('/');

      cashPayment = {
        enterprise_id : $scope.enterprise.id,
        bon : 'E',
        bon_num : bon_num,
        date : date,
        debit_account : $scope.cashbox.cash_account,
        credit_account : $scope.debitor.account_id,
        currency_id : $scope.cashbox.currency_id,
        cost: precision.round(data.payment),
        description : description,
        cashier_id : 1,
        cashbox_id : 1,
        deb_cred_id : $scope.debitor.id,
        deb_cred_type : 'D'
      };

      return connect.basicPut('cash', [cashPayment]);
    }

    function processCashItems (res) {
      // format cash items and submit them
      var records,
          id = res.data.insertId;

      $scope.invoice_id = id; // clean this up to make it more testable

      records = $scope.queue
        .filter(function (invoice) {
          return invoice.allocated > 0;
        })
        .map(function (invoice) {
          return {
            cash_id: id,
            allocated_cost : precision.round(invoice.allocated),
            invoice_id : invoice.inv_po_id
          };
        });

      if (precision.compare(data.total, data.raw) !== 0) {
        records.push({
          cash_id : id,
          allocated_cost : precision.compare(data.total, data.raw),
          invoice_id : 0
        });
      }

      return connect.basicPut('cash_item', records);
    }

    function postToJournal (res) {
      return connect.fetch('/journal/cash/' + $scope.invoice_id);
    }

    function showReceipt () {
      $location.path('/invoice/cash/' + $scope.invoice_id);
    }

    $scope.payInvoices = function pay () {
      // FIXME: add a 'would you like to credit or pay back' line/check here for excess
      // run digestInvoice once more to stabilize.
      if (!exchange.map) {
        return messenger.danger($translate('CASH.NO_EXCHANGE_RATE'));
      }

      $scope.digestInvoice();

      processCashInvoice()
        .then(processCashItems)
        .then(postToJournal)
        .then(showReceipt)
        .catch(function (err) {
          messenger.danger('An error occured' + JSON.stringify(err));
        });
    };

    function generateBonNumber (model, bon_type) {
      // filter by bon type, then gather ids.
      var ids = model.filter(function(row) {
        return row.bon === bon_type;
      }).map(function(row) {
        return row.bon_num;
      });
      return (ids.length < 1) ? 1 : Math.max.apply(Math.max, ids) + 1;
    }

    function digestExchangeRate () {
      // exchange everything queued to be paid, as well as those in
      // the list.
      //
      $scope.queue.forEach(function (invoice) {
        invoice.locale = exchange(invoice.balance, $scope.cashbox.currency_id);
      });

      ($scope.ledger || []).forEach(function (invoice) {
        invoice.locale = exchange(invoice.balance, $scope.cashbox.currency_id);
      });

      // finally digest the invoice
      $scope.digestInvoice();
    }

    // FIXME: This is suboptimal, but very readable.
    // Everytime a cashbox changes or the ledger gains
    // or loses items, the invoice balances are
    // exchanged into the appropriate locale currency.
    $scope.$watch('ledger', digestExchangeRate, true);
    $scope.$watch('cashbox', digestExchangeRate, true);
    $scope.$watch('queue', $scope.digestTotal, true);
    $scope.$watch('data.payment', $scope.digestInvoice);

  }
]);

