angular.module('kpk.controllers')
.controller('cash', [
  '$scope',
  '$location',
  '$translate',
  '$window',
  'connect',
  'appcache',
  'appstate',
  'messenger',
  'validate',
  'exchange',
  'util',
  'precision',
  'calc',
  'uuid',
  function($scope, $location, $translate, $window, connect, Appcache, appstate, messenger, validate, exchange, util, precision, calc, uuid) {
    var dependencies = {},
        data = $scope.data = {},
        cache = new Appcache('cash');

    $scope.queue = [];
    data.payment = 0;
    data.total = 0;
    data.raw = 0;
  
    dependencies.cashboxes = {
      query : {
        tables : {
          'currency_account' : {
            columns : ['id', 'enterprise_id', 'currency_id', 'cash_account', 'bank_account']
          },
          'currency' : {
            columns : ['symbol']
          },
          'account' : {
            columns : ['account_txt']
          }
        },
        join : [
          'currency_account.currency_id=currency.id',
          'account.id=currency_account.cash_account'
        ],
      }
    };

    dependencies.cash = {
      query : {
        tables: {
          'cash' : {
            columns: ['uuid', 'document_id', 'type', 'date', 'debit_account', 'credit_account', 'currency_id', 'user_id', 'cost', 'description']
          }
        }
      }
    };
   
    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.cashboxes.query.where =
        ['currency_account.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies).then(setUpModels, handleErrors);
    });
   

    function loadCashBox(box) {
      if (box) { $scope.cashbox = box; }
    }

    cache.fetch('cashbox').then(loadCashBox);

    function setUpModels(models) {
      for (var k in models) {
        $scope[k] = models[k];
      }
     
      if (!$scope.cashbox) {
        $scope.cashbox = $scope.cashboxes.get($scope.project.currency_id);
      }
    }

    function handleErrors(error) {
      messenger.danger('Error:', JSON.stringify(error));
    }

    $scope.setCashBox = function setCashBox (box) {
      $scope.cashbox = box;
      cache.put('cashbox', box);
    };

    $scope.loadInvoices = function (patient) {
      $scope.ledger = [];
      $scope.queue = [];
      $scope.patient = patient;
      connect.fetch('/ledgers/debitor/' + patient.debitor_uuid)
      .success(function (data) {
        console.log('[loaded] ', data);
        $scope.ledger = data.filter(function (row) {
          return row.balance > 0;
        });
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
      $scope.data.raw = $scope.queue.reduce(addTotal, 0);
      if (!$scope.cashbox) { return; }
      var dirty = calc(data.raw, $scope.cashbox.currency_id);
      $scope.data.total = dirty.total;
      $scope.data.difference = dirty.difference;

      // digest overdue
      var over  = precision.round($scope.data.payment - $scope.data.total, 3);
      $scope.data.overdue = over > 0 ? over : 0;
    };

    $scope.digestInvoice = function () {
      if (!$scope.queue) { return null; }

      var proposed = $scope.data.payment || 0;

      $scope.queue.forEach(function (invoice) {
        if (proposed < 0) {
          invoice.allocated = 0;
          return null;
        }

        var diff = precision.round(proposed - invoice.locale);
        invoice.allocated = diff >= 0 ? invoice.locale : proposed;
        proposed = diff >= 0 ? diff : 0;
       
        invoice.remaining = precision.compare(invoice.locale, invoice.allocated);
      });

      var over  = data.payment - data.total;
      data.overdue = over > 0 ? over : 0;

    };


    function processCashInvoice () {
      // Gather data and submit the cash invoice
      var document_id, cashPayment, date, description;

      // we need to figure out if they are paying the total amount
      // if they are, it means that the absolute value of
      // precision.compare(precision.round(data.payment), data.total)
      // should be less than currency.min_monentary_unit

      date = util.convertToMysqlDate(new Date());

      if ($scope.data.overdue) { return $window.alert($translate('CASH.ERR_OVERPAYING')); }

      document_id = generateDocumentId($scope.cash.data, 'E');
      description = ['CP E', document_id, $scope.patient.first_name, date].join('/');

      $scope.payment_uuid = uuid();

      cashPayment = {
        uuid : $scope.payment_uuid,
        project_id : $scope.project.id,
        type : 'E',
        document_id : document_id,
        date : date,
        debit_account : $scope.cashbox.cash_account,
        credit_account : $scope.patient.account_id,
        currency_id : $scope.cashbox.currency_id,
        cost: precision.round(data.payment),
        description : description,
        user_id : 1,
        cashbox_id : 1,
        deb_cred_uuid : $scope.patient.debitor_uuid,
        deb_cred_type : 'D'
      };

      return connect.basicPut('cash', [cashPayment]);
    }

    function processCashItems (res) {
      // format cash items and submit them
      var records,
          id = $scope.payment_uuid;

      $scope.invoice_uuid = id; // clean this up to make it more testable

      records = $scope.queue
      .filter(function (invoice) {
        return invoice.allocated > 0;
      })
      .map(function (invoice) {
        return {
          uuid : uuid(),
          cash_uuid: id,
          allocated_cost : precision.round(invoice.allocated),
          invoice_uuid : invoice.inv_po_id
        };
      });

      return connect.basicPut('cash_item', records);
    }

    function postToJournal (res) {
      return connect.fetch('/journal/cash/' + $scope.invoice_uuid);
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

    function generateDocumentId(model, type) {
      // filter by bon type, then gather ids.
      var ids = model.filter(function(row) {
        return row.type === type;
      }).map(function(row) {
        return row.document_id;
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

