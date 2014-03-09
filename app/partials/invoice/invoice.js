//TODO Debtor table currently has no personal information - this strictly ties debtors to patients (or some existing table) - a reverse lookup from debtor/ creditor ID to recipient is needed
angular.module('kpk.controllers').controller('invoice', function($scope, $routeParams, $q, validate, messenger, exchange, appstate) {
  var dependencies = {}, origin = $scope.origin = $routeParams.originId, invoiceId = $routeParams.invoiceId, process = {}, timestamp = $scope.timestamp = new Date();
  if(!(origin && invoiceId)) throw new Error('Invalid parameters');

  process = {
    'cash': processCash,
    'sale': processSale,
    'credit': processCredit,
    'debtor': processDebtor,
    'patient' : processPatient,
    'caution' : processCaution
  };
  dependencies.recipient = {
    required: true
  };

  dependencies.invoice = {
    required: true,
    query: {
      tables: {},
      // where: [origin + '.id=' + invoiceId]
      where: ['sale.id=' + invoiceId]
    }
  };

  dependencies.currency = {
    query : {
      tables : {
        'currency_account' : {
          columns : ['id', 'enterprise_id', 'currency_id', 'cash_account', 'bank_account', 'caution_account']
        },
        'currency' : {
          columns : ['symbol']
        }
      },
      join : ['currency_account.currency_id=currency.id'],
    }
  };


  // dependencies.invoice.query.tables[origin] = {
  dependencies.invoice.query.tables['sale'] = {
    columns: ['id', 'cost', 'currency_id', 'debitor_id', 'seller_id', 'invoice_date', 'note']
  };

  //TODO sale_item hardcoded - have a map form originId to table name, item table name, recipient table name
  dependencies.invoiceItem = {
    required: true,
    query: {
      tables: {},
      join: ['sale_item.inventory_id=inventory.id'],
      where: ['sale_item.sale_id=' + invoiceId]
    }
  };
invoice
  dependencies.invoiceItem.query.tables['inventory'] = {
    columns: ['id', 'code', 'text']
  };

  dependencies.invoiceItem.query.tables['sale_item'] = {
    columns: ['id', 'quantity', 'debit', 'credit', 'transaction_price', 'sale_id']
  };

  dependencies.location = {
    required: false
  };

  dependencies.ledger = {
    identifier: 'inv_po_id'
  };

  appstate.register('enterprise', function (enterprise) {
    $scope.enterprise = enterprise;
    process[origin](invoiceId);
  });

  function processCash(requestId) {
    dependencies.cash = {
      required: true,
      query:  {
        tables: {
          cash: { columns: ['id', 'date', 'cost', 'deb_cred_id', 'currency_id'] },
          cash_item: { columns: ['cash_id', 'allocated_cost', 'invoice_id'] }
        },
        join: ['cash_item.cash_id=cash.id'],
        where: ['cash_item.cash_id=' + requestId]
      }
    };

    validate.process(dependencies, ['cash']).then(buildInvoiceQuery);
  }

  function processSale() {
    validate.process(dependencies, ['invoice', 'invoiceItem']).then(buildRecipientQuery);
  }

  //TODO this process is kind of a hack
  function processCredit(invoiceId) {
    dependencies = {};
    dependencies.credit = {
      required: true,
      query: {
        tables: {
          credit_note: { columns: ['id', 'cost', 'debitor_id', 'seller_id', 'sale_id', 'note_date', 'description'] },
          patient: { columns: ['first_name', 'last_name', 'current_location_id'] }
        },
        join: ['credit_note.debitor_id=patient.debitor_id'],
        where: ['credit_note.id=' + invoiceId]
      }
    };
    validate.process(dependencies, ['credit']).then(buildCreditRecipient);
  }

  function processDebtor() {
    messenger.danger('Method not implemented');
  }

  function processCaution (caution_id){
    dependencies.caution = {
      required: true,
      query:  {
        tables: {
          caution: { columns: ['id', 'value', 'debitor_id', 'enterprise_id', 'currency_id'] },
          patient : {columns : ['first_name', 'last_name', 'current_location_id']}
        },
        join : ['caution.debitor_id=patient.debitor_id'],
        where: ['caution.id=' + caution_id]
      }
    };
    validate.process(dependencies, ['caution']).then(buildCaution);
  }

  function processPatient() {
    dependencies.recipient.query = {
      tables: {},
      where: ['patient.id=' + invoiceId]
    };

    dependencies.recipient.query.tables['patient'] = {
      columns: ['id', 'first_name', 'last_name', 'dob', 'current_location_id', 'debitor_id', 'registration_date']
    };

    validate.process(dependencies, ['recipient']).then(buildPatientLocation);
  }

  function buildCaution (model) {
    dependencies.location = {
      required: true,
      query: '/location/' + model.caution.data[0].current_location_id
    };

    validate.process(dependencies, ['location']).then(cautionInvoice);
  }

  function buildPatientLocation(model) {
    dependencies.location = {
      required: true,
      query: '/location/' + model.recipient.data[0].current_location_id
    };

    validate.process(dependencies, ['location']).then(patientReceipt);
  }

  function buildInvoiceQuery(model) {
    var cash_data = []; var invoiceCondition = dependencies.invoice.query.where = [];
    var invoiceItemCondition = dependencies.invoiceItem.query.where = [];

    model.cash.data.forEach(function(invoiceRef, index) {

      if(index!==0) {
        invoiceCondition.push('OR');
        invoiceItemCondition.push('OR');
      }

      invoiceCondition.push("sale.id=" + invoiceRef.invoice_id);
      invoiceItemCondition.push("sale_item.sale_id=" + invoiceRef.invoice_id);
    });

    dependencies.invoice.query.where = invoiceCondition;
    dependencies.invoiceItem.query.where = invoiceItemCondition;

    processSale();
  }

  //TODO credit hack
  function buildCreditRecipient(model) {
    dependencies.location = {
      required: true,
      query: '/location/' + model.credit.data[0].current_location_id
    };

    validate.process(dependencies).then(creditInvoice);
  }

  function buildRecipientQuery(model) {
    var invoice_data = model.invoice.data[0];

    // dependencies.saleDetails = {
    //   query : 'saleDetails/'+model.invoice.data[0].debitor_id
    // };

    dependencies.recipient.query = {
      tables: {},
      where: ['patient.debitor_id=' + invoice_data.debitor_id]
    };

    dependencies.recipient.query.tables['patient'] = {
      columns: ['first_name', 'last_name', 'dob', 'current_location_id']
    };

    dependencies.ledger.query = 'ledgers/debitor/' + invoice_data.debitor_id;
    return validate.process(dependencies, ['recipient']).then(buildLocationQuery);
  }

  function buildLocationQuery(model) {
    var recipient_data = model.recipient.data[0];

    dependencies.location.query = 'location/' + recipient_data.current_location_id;
    return validate.process(dependencies).then(invoice);
  }

  function invoice(model) {
    console.log('[invoice method] appelle de la methode invoice le model est : ', model);
    var routeCurrencyId;
    //Expose data to template
    $scope.model = model;


    $scope.session = {};
    $scope.session.currentCurrency = $scope.model.currency.get($scope.enterprise.currency_id);
    routeCurrencyId = $scope.session.currentCurrency.currency_id;

    //Default sale receipt should only contain one invoice record - kind of a hack for multi-invoice cash payments
    $scope.invoice = $scope.model.invoice.data[$scope.model.invoice.data.length-1];
    $scope.invoice.totalSum = 0;
    $scope.invoice.ledger = $scope.model.ledger.get($scope.invoice.id);
    console.log('[get.invoice.id] a donnee :', $scope.invoice.ledger);

    $scope.recipient = $scope.model.recipient.data[0];
    $scope.recipient.location = $scope.model.location.data[0];


    //FIXME huge total hack
    $scope.model.invoice.data.forEach(function(invoiceRef) {
      $scope.invoice.totalSum += invoiceRef.cost;
    });

    //FIXME hacks for meeting
    if(model.cash) {
      $scope.cashTransaction  = $scope.model.cash.data[0];
      routeCurrencyId = $scope.cashTransaction.currency_id;
    }

    updateCost(routeCurrencyId);
  }
  function patientReceipt(model) { $scope.model = model; $scope.recipient = $scope.model.recipient.data[0]; $scope.location = $scope.model.location.data[0]; }
  //TODO Follows the process credit hack
  function creditInvoice(model) { $scope.model = model; $scope.note = $scope.model.credit.data[0]; $scope.location = $scope.model.location.data[0]; }

  function cautionInvoice (model) {$scope.model = model; $scope.location = $scope.model.location.data[0]; $scope.caution = $scope.model.caution.data[0];}

  function convertAmount (value, currency_id){
    return exchange.myExchange(value, currency_id); //FIX ME exchange doesn't give expected values, so created an other called myExchange
  }
  function updateCost(currency_id) {
    $scope.invoice.localeCost = exchange($scope.invoice.cost, currency_id);
    var balance = ($scope.invoice.ledger)? $scope.invoice.ledger.balance : 0;//if undefined, user uses is caution
    $scope.invoice.localeBalance = exchange(balance, currency_id);

    var credit = ($scope.invoice.ledger)? $scope.invoice.ledger.credit : 0;
    $scope.invoice.localeCredit = exchange(credit, currency_id);

    $scope.invoice.localeTotalSum = exchange($scope.invoice.totalSum, currency_id);

    $scope.model.invoiceItem.data.forEach(function (item) {
      item.localeCost = exchange((item.credit - item.debit), currency_id);
    });
  }

  $scope.updateCost = updateCost;
  $scope.convertAmount = convertAmount;
});
