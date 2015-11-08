angular.module('bhima.controllers')
.controller('CashController', CashController);

CashController.$inject = [
  '$scope', '$location', '$modal', '$q', 'connect', 'appcache',
  'appstate', 'messenger', 'validate', 'exchange', 'util', 'precision',
  'calc', 'uuid', 'SessionService'
];

function CashController($scope, $location, $modal, $q, connect, Appcache, appstate, messenger, validate, exchange, util, precision, calc, uuid, Session) {
  var defaultCashBox, defaultCurrency;

  var dependencies = {},
      data = $scope.data = {},
      session = $scope.session = {},
      cache = new Appcache('cash');

  $scope.queue = [];
  data.payment = 0;
  data.total = 0;
  data.raw = 0;
  session.loading = false;

  dependencies.cashboxes = {
    query : {
      tables : {
        'cash_box' : {
          columns : ['id', 'text', 'project_id']
        }
      }
    }
  };

  dependencies.projects = {
    query : {
      tables : {
        'project' : {
          columns : ['id', 'abbr']
        }
      }
    }
  };

  // TODO currently fetches all accounts, should be selected by project
  dependencies.cashbox_accounts = {
    query : {
      identifier : 'currency_id',
      tables : {
        'cash_box_account_currency' : {
          columns : ['id', 'cash_box_id', 'currency_id', 'account_id']
        },
        'currency' : {
          columns : ['symbol']
        },
        'account' : {
          columns : ['account_txt']
        }
      },
      join : [
        'cash_box_account_currency.currency_id=currency.id',
        'account.id=cash_box_account_currency.account_id'
      ]
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

  function loadDefaultCurrency(currency) {
    if (!currency) { return; }
    defaultCurrency = currency;

    // Fallback for slow IDB read
    if ($scope.currency) { $scope.currency = currency; }
  }

  function loadDefaultCashBox(cashBox) {
    if (!cashBox) { return; }
    defaultCashBox = cashBox;

    // Fallback for slow IDB read
    if ($scope.cashbox) { $scope.cashbox = cashBox; }
  }

  cache.fetch('cashbox').then(loadDefaultCashBox);
  cache.fetch('currency').then(loadDefaultCurrency);

  appstate.register('project', function (project) {
    $scope.project = project;
    dependencies.cashboxes.query.where =
      ['cash_box.project_id=' + project.id, 'AND', 'cash_box.is_auxillary=1'];

    validate.process(dependencies, ['cashboxes', 'cash', 'projects'])
    .then(setUpModels, handleErrors);
  });

  function setUpModels(models) {
    // set up the user
    $scope.user = Session.user;

    angular.extend($scope, models);
    if (!$scope.cashbox) {
      var sessionDefault =
        $scope.cashboxes.data[0];

      if (defaultCashBox) {
        var verifyBox = $scope.cashboxes.get(defaultCashBox.id);
        if (verifyBox) { sessionDefault = verifyBox; }
      }

      $scope.setCashBox(sessionDefault);
    }

    haltOnNoExchange();
  }

  function haltOnNoExchange () {
    if (exchange.hasDailyRate()) { return; }

    var instance = $modal.open({
      templateUrl : 'partials/exchangeRateModal/exchangeRateModal.html',
      backdrop    : 'static',
      keyboard    : false,
      controller  : 'exchangeRateModal'
    });

    instance.result.then(function () {
      $location.path('/exchange');
    })
    .catch(function () {
      $scope.errorState = true;
    });
  }

  function handleErrors(error) {
    messenger.danger('Error:', JSON.stringify(error));
  }

  $scope.setCashBox = function setCashBox (box) {
    $scope.cashbox = box;
    cache.put('cashbox', box);

    dependencies.cashbox_accounts.query.where =
      ['cash_box_account_currency.cash_box_id=' + $scope.cashbox.id];
    validate.refresh(dependencies, ['cashbox_accounts'])
    .then(refreshCurrency);
  };

  function refreshCurrency(model) {
    var sessionDefault;

    angular.extend($scope, model);

    sessionDefault =
      $scope.cashbox_accounts.get($scope.project.currency_id) ||
      $scope.cashbox_accounts.data[0];

    if (defaultCurrency) {
      var verifyCurrency = $scope.cashbox_accounts.get(defaultCurrency.currency_id);
      if (verifyCurrency)  { sessionDefault = verifyCurrency; }
    }

    // Everything sucks
    if (!sessionDefault) { return messenger.danger('Cannot find accounts for cash box ' + $scope.cashbox.id); }

    $scope.setCurrency(sessionDefault);
  }

  $scope.setCurrency = function setCurrency(currency) {
    $scope.currency = currency;
    cache.put('currency', currency);
  };

  $scope.loadInvoices = function loadinInvoices(patient) {
    $scope.ledger = [];
    $scope.queue = [];
    $scope.patient = patient;

    // TODO -- why can't we just use the is_convention property?
    if (patient.is_convention === 1) {
      session.patient = 'is_convention';
    } else {
      session.patient = 'not_convention';
    }

    session.loading = true;

    // TODO -- error handling?
    connect.fetch('/ledgers/debitor/' + patient.debitor_uuid)
    .then(function (data) {


      $scope.ledger = data.filter(function (row) {
        return row.balance > 0;
      });
    })
    .finally(function () { session.loading = false; });
  };

  $scope.add = function add(idx) {
    var invoice = $scope.ledger.splice(idx, 1)[0];
    invoice.allocated = 0;
    $scope.queue.push(invoice);
  };

  $scope.remove = function remove(idx) {
    $scope.ledger.push($scope.queue.splice(idx, 1)[0]);
  };

  function addTotal(n, m) {
    return precision.round(n + m.locale);
  }

  $scope.digestTotal = function () {
    $scope.data.raw = $scope.queue.reduce(addTotal, 0);
    if (!$scope.cashbox) { return; }
    var dirty = calc(data.raw, $scope.currency.currency_id);
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

  function initPayment () {
    var id, date, invoice, instance, defer = $q.defer();

    date = util.sqlDate(new Date());
    id = generateDocumentId($scope.cash.data, 'E');

    invoice = {
      date : date,
      document_id : id,
      description : [$scope.project.abbr + '_CAISSEAUX', id, $scope.patient.last_name, date].join('/')
    };

    if ($scope.data.overdue) {
      instance = $modal.open({
        templateUrl : 'partials/cash/justify_modal.html',
        backdrop    : 'static',
        keyboard    : false,
        controller  : 'justifyModal',
        resolve : {
          data : function () {
            return $scope.data;
          }
        }
      });

      instance.result.then(function (description) {
        if (description) { invoice.description += ' ' + description; }
        defer.resolve({invoice : invoice, creditAccount : !!description });
      }, function () {
        defer.reject();
      });
    } else {
      defer.resolve({ invoice : invoice, creditAccount : false });
    }

    return defer.promise;
  }

  $scope.invoice = function invoice () {
    var payment, records, creditAccount, id = uuid();

    initPayment()
    .then(function (data) {
      // pay the cash payment
      creditAccount = data.creditAccount;
      var account = $scope.cashbox_accounts.get($scope.currency.currency_id);

      payment = data.invoice;
      payment.uuid = id;
      payment.type = 'E';
      payment.project_id = $scope.project.id;
      payment.debit_account = account.account_id;
      payment.credit_account = $scope.patient.account_id;
      payment.currency_id = $scope.currency.currency_id;
      payment.cost = precision.round($scope.data.payment);
      payment.deb_cred_uuid = $scope.patient.debitor_uuid;
      payment.deb_cred_type = 'D';
      payment.cashbox_id = $scope.cashbox.id;
      payment.reference = 1; // TODO : This is a mistake

      payment.user_id = $scope.user.id;

      return connect.post('cash', [payment]);
    })
    .then(function () {
      // pay each of the cash items
      records = [];

      $scope.queue.forEach(function (record) {
        if (record.allocated < 0) { return; }
        records.push({
          uuid           : uuid(),
          cash_uuid      : id,
          allocated_cost : precision.round(record.allocated),
          invoice_uuid   : record.inv_po_id
        });
      });

      if (creditAccount) {
        records.push({
          uuid : uuid(),
          cash_uuid : id,
          allocated_cost : precision.round($scope.data.payment - $scope.data.raw),
          invoice_uuid : null
        });
      }

      return connect.post('cash_item', records);
    })
    .then(function () {
      return connect.fetch('/journal/cash/' + id);
    })
    .then(function () {
      $location.path('/invoice/cash/' + id);
    })
    .catch(function (err) {
      if (err) { return messenger.danger(err.data.code); }
      messenger.danger('Payment failed for some unknown reason.');
    })
    .finally();
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

    $scope.queue.forEach(function (invoice) {
      invoice.locale = exchange(invoice.balance, $scope.currency.currency_id);
    });

    ($scope.ledger || []).forEach(function (invoice) {
      invoice.locale = exchange(invoice.balance, $scope.currency.currency_id);
    });

    // finally digest the invoice
    $scope.digestInvoice();
  }

  // FIXME: This is suboptimal, but very readable.
  // Everytime a cashbox changes or the ledger gains
  // or loses items, the invoice balances are
  // exchanged into the appropriate locale currency.

  // NOTE -- $watchCollection is not appropriate here
  // far too shallow
  $scope.$watch('ledger', digestExchangeRate, true);
  $scope.$watch('currency', digestExchangeRate);
  $scope.$watch('queue', $scope.digestTotal, true);
  $scope.$watch('data.payment', $scope.digestInvoice);
}
