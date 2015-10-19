angular.module('bhima.controllers')
.controller('CautionController', CautionController);

CautionController.$inject = [
  '$location', '$translate', '$modal', 'validate', 'connect',
  'appstate', 'messenger', 'uuid', 'appcache', 'exchange', 'SessionService'
];

function CautionController($location, $translate, $modal, validate, connect, appstate, messenger, uuid, Appcache, exchange, Session) {
  var vm = this;

  // bind state variables
  vm.state = 'default';
  vm.project = Session.project;
  vm.user = Session.user;

  // bind methods
  vm.loadPatient = loadPatient;
  vm.payCaution = payCaution;
  vm.setCurrency = setCurrency;
  vm.setCashBox = setCashBox;

  /* ------------------------------------------------------------------------ */

  var dependencies = {},
      session = vm.session = {},
      cache = new Appcache('caution');

  dependencies.cashboxes = {
    query : {
      tables : {
        'cash_box' : {
          columns : ['id', 'text', 'project_id']
        }
      },
      where : [
        'cash_box.is_auxillary=1',
        'AND', 'cash_box.project_id=' + vm.project.id]
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
          columns : ['symbol', 'min_monentary_unit']
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

  dependencies.accounts = {
    required : true,
    query : {
      tables : {
        'account' : {
          columns : ['id','account_number', 'account_txt']
        }
      },
      where : ['account.enterprise_id=' + vm.project.enterprise_id]
    }
  };

  function handler(error) {
    console.log(error);
  }

  function startup(models) {
    angular.extend(vm, models);

    if (vm.cashbox) {
      var sessionDefault =
        vm.cashboxes.data[0];

      setCashBox(sessionDefault);
    }
  }

  function loadPatient(patient) {
    if (!patient) {
      return messenger.danger('No patient selected');
    }

    vm.debtor = patient;

    connect.fetch('/location/detail/' + patient.origin_location_id)
    .then(function (data) {
      vm.location = data[0];
    })
    .catch(handler);

    connect.fetch('/reports/patientStanding/?id=' + patient.debitor_uuid)
    .then(function (data) {
      var receipts = data.receipts || [];

      vm.accountBalance = receipts.reduce(function (balance, receipt) {
        return balance + (receipt.debit - receipt.credit);
      }, 0);
    })
    .catch(handler);
  }

  function payCaution(invalid) {

    // if form validation fails, reject outright
    if (invalid) { return; }

    var record = {
      project_id      : vm.project.id,
      reference       : 1, // FIXME: Workaround for dead triggers
      uuid            : uuid(),
      type            : 'E',
      date            : new Date(),
      debit_account   : vm.currency.account_id,
      credit_account  : vm.debtor.account_id,
      deb_cred_uuid   : vm.debtor.debitor_uuid,
      deb_cred_type   : 'D',
      currency_id     : vm.currency.currency_id,
      cost            : session.payment,
      cashbox_id      : vm.cashbox.id,
      description     : [vm.project.abbr + '_CAISSEAUX_CAUTION', vm.debtor.first_name + ' - '+ vm.debtor.name + ' - ' + vm.debtor.last_name].join('/'),
      is_caution      : 1,
      user_id         : vm.user.id
    };

    var record_item = {
      uuid:           uuid(),
      cash_uuid:      record.uuid,
      allocated_cost: record.cost
    };

    record.user_id = vm.user.id;

    // submit the record
    connect.post('cash', record)
    .then(function () {
      return connect.post('cash_item', record_item);
    })
    .then(function () {
      return connect.fetch('/journal/caution/' + record.uuid);
    })
    .then(function () {
      $location.path('/invoice/caution/' + record.uuid);
    })
    .catch(function (error) {
      handleError(record);
    });
  }

  // TODO -- this should be done on the server for safety reasons
  function handleError(record) {
    connect.delete('posting_journal', 'inv_po_id', record.uuid)
    .then(function () {
      return connect.delete('cash_item', 'cash_uuid', record.uuid);
    })
    .then(function () {
      return connect.delete('cash', 'uuid', record.uuid);
    })
    .catch(handler)
    .finally(function () {
      messenger.danger($translate.instant('CAUTION.DANGER'));
    });
  }

  function load(selectedItem) {
    if (!selectedItem) { return; }
    vm.selectedItem = selectedItem;
  }

  function initialise() {

    validate.process(dependencies)
    .then(startup)
    .then(haltOnNoExchange)
    .catch(handler);


    // load defaults
    cache.fetch('cashbox').then(loadDefaultCashBox);
    cache.fetch('currency').then(loadDefaultCurrency);
  }

  function setCurrency(currency) {
    vm.currency = currency;
    cache.put('currency', currency);
  }

  function setCashBox(box) {
    vm.cashbox = box;
    cache.put('cashbox', box);

    dependencies.cashbox_accounts.query.where =
      ['cash_box_account_currency.cash_box_id=' + vm.cashbox.id];

    validate.refresh(dependencies, ['cashbox_accounts'])
    .then(refreshCurrency);
  }

  function loadDefaultCurrency(currency) {
    if (!currency) { return; }
    vm.currency = currency;
  }

  function loadDefaultCashBox(cashbox) {
    if (!cashbox) { return; }
    vm.cashbox = cashbox;
  }

  function refreshCurrency(model) {
    var sessionDefault;

    angular.extend(vm, model);

    sessionDefault =
      vm.cashbox_accounts.get(vm.project.currency_id) ||
      vm.cashbox_accounts.data[0];

    // Everything sucks
    if (!sessionDefault) { return messenger.danger('Cannot find accounts for cash box ' + vm.cashbox.id); }

    setCurrency(sessionDefault);
  }

  function haltOnNoExchange() {
    if (exchange.hasDailyRate()) { return; }

    var instance = $modal.open({
      templateUrl : 'partials/exchangeRateModal/exchangeRateModal.html',
      backdrop    : 'static',
      keyboard    : false,
      controller  : 'exchangeRateModal'
    });

    instance.result.then(function () {
      $location.path('/exchange_rate');
    });
  }

  initialise();
}
