//TODO Debtor table currently has no personal information - this strictly ties debtors to patients (or some existing table) - a reverse lookup from debtor/ creditor ID to recipient is needed
<<<<<<< HEAD
angular.module('kpk.controllers')
.controller('invoice', [
  '$scope',
  '$routeParams',
  '$q',
  'validate',
  'messenger',
  'exchange',
  'appstate',
  function ($scope, $routeParams, $q, validate, messenger, exchange, appstate) {

    var dependencies = {},
        origin       = $scope.origin = $routeParams.originId,
        invoiceId    = $routeParams.invoiceId,
        process      = {},
        timestamp    = $scope.timestamp = new Date();

    if(!(origin && invoiceId)) { throw new Error('Invalid parameters'); }

    process = {
      'cash': processCash,
      'sale': processSale,
      'credit': processCredit,
      'debtor': processDebtor,
      'patient' : processPatient,
    };
=======
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
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c

    dependencies.recipient = {
      required: true
    };

    dependencies.invoice = {
      required: true,
      query: {
        tables: {
          'sale' : {
            columns: ['uuid', 'cost', 'currency_id', 'debitor_uuid', 'seller_id', 'invoice_date', 'note', 'project_id', 'reference']
          },
          'project' : {
            columns : ['abbr']
          }
        },
        join : ['sale.project_id=project.id'],
        // where: [origin + '.id=' + invoiceId]
        where: ['sale.uuid=' + invoiceId]
      }
    };

    dependencies.currency = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
    };

    // dependencies.invoice.query.tables[origin] = {
    /*
    dependencies.invoice.query.tables['sale'] = {
      columns: ['uuid', 'cost', 'currency_id', 'debitor_uuid', 'seller_id', 'invoice_date', 'note', 'project_id', 'reference']
    };

    dependencies.invoice.query.tables['project'] = {
      columns: ['abbr']
    };

    dependencies.invoice.query.join = ['sale.project_id=project.id'];
    */

    //TODO sale_item hardcoded - have a map form originId to table name, item table name, recipient table name
    dependencies.invoiceItem = {
      required: true,
      query: {
        tables: {
          inventory : {
            columns: ['uuid', 'code', 'text']
          },
          sale_item : {
            columns: ['uuid', 'quantity', 'debit', 'credit', 'transaction_price', 'sale_uuid']
          }
        },
        join: ['sale_item.inventory_uuid=inventory.uuid'],
        where: ['sale_item.sale_uuid=' + invoiceId]
      }
    };

<<<<<<< HEAD
    /*
    dependencies.invoiceItem.query.tables['inventory'] = {
      columns: ['uuid', 'code', 'text']
=======
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
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c
    };

    dependencies.invoiceItem.query.tables['sale_item'] = {
      columns: ['uuid', 'quantity', 'debit', 'credit', 'transaction_price', 'sale_uuid']
    };
    */

<<<<<<< HEAD
=======
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
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c
    dependencies.location = {
      required: false
    };
<<<<<<< HEAD

    dependencies.ledger = {
      identifier: 'inv_po_id'
    };
=======

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
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c

    appstate.register('project', function (project) {
      $scope.project = project;
      process[origin](invoiceId);
    });

    function processCash(requestId) {
      dependencies.cash = {
        required: true,
        query:  {
          tables: {
            cash: { columns: ['uuid', 'date', 'cost', 'deb_cred_uuid', 'currency_id'] },
            cash_item: { columns: ['cash_uuid', 'allocated_cost', 'invoice_uuid'] },
            sale: { columns : ['reference']}
          },
          join: ['cash_item.cash_uuid=cash.uuid', 'cash_item.invoice_uuid=sale.uuid'],
          where: ['cash_item.cash_uuid=' + requestId]
        }
      };

      validate.process(dependencies, ['cash'])
      .then(buildInvoiceQuery);
    }

    function processSale() {
      validate.process(dependencies, ['invoice', 'invoiceItem'])
      .then(buildRecipientQuery);
    }

    //TODO this process is kind of a hack
    function processCredit(invoiceId) {
      dependencies = {};
      dependencies.credit = {
        required: true,
        query: {
          tables: {
            credit_note: { columns: ['id', 'cost', 'debitor_id', 'seller_id', 'sale_id', 'note_date', 'description'] },
            patient: { columns: ['first_name', 'last_name', 'current_location_id', 'reference'] },
            project: { columns: ['abbr'] }
          },
          join: ['credit_note.debitor_id=patient.debitor_id'],
          where: ['credit_note.id=' + invoiceId]
        }
      };
      validate.process(dependencies, ['credit']).then(buildCreditRecipient);
    }

<<<<<<< HEAD
    function processDebtor() {
      messenger.danger('Method not implemented');
    }
=======
  function buildRecipientQuery(model) {
    var invoice_data = model.invoice.data[0];

    // dependencies.saleDetails = {
    //   query : 'saleDetails/'+model.invoice.data[0].debitor_id
    // };

    dependencies.recipient.query = {
      tables: {},
      where: ['patient.debitor_id=' + invoice_data.debitor_id]
    };
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c

    function processPatient() {
      dependencies.recipient.query = {
        tables: {},
        where: ['patient.uuid=' + invoiceId]
      };

      dependencies.recipient.query.tables['patient'] = {
        columns: ['uuid', 'reference', 'first_name', 'last_name', 'dob', 'current_location_id', 'debitor_uuid', 'registration_date']
      };

      dependencies.recipient.query.tables['project'] = {
        columns: ['abbr']
      };

      dependencies.recipient.query.join = ['patient.project_id=project.id'];

<<<<<<< HEAD
      validate.process(dependencies, ['recipient']).then(buildPatientLocation);
    }
=======
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
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c

    function buildPatientLocation(model) {
      dependencies.location = {
        required: true,
        query: '/location/' + model.recipient.data[0].current_location_id
      };

      validate.process(dependencies, ['location']).then(patientReceipt);
    }

<<<<<<< HEAD
    function buildInvoiceQuery(model) {
      var cash_data = [];
      var invoiceCondition = dependencies.invoice.query.where = [];
      var invoiceItemCondition = dependencies.invoiceItem.query.where = [];

      model.cash.data.forEach(function(invoiceRef, index) {
        console.log('invoice ref', invoiceRef);

        if(index!==0) {
          invoiceCondition.push('OR');
          invoiceItemCondition.push('OR');
        }

        invoiceCondition.push("sale.uuid=" + invoiceRef.invoice_uuid);
        invoiceItemCondition.push("sale_item.sale_uuid=" + invoiceRef.invoice_uuid);
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

      dependencies.recipient.query = {
        tables: {},
        where: ['patient.debitor_uuid=' + invoice_data.debitor_uuid]
      };

      dependencies.recipient.query.tables['patient'] = {
        columns: ['first_name', 'last_name', 'dob', 'current_location_id', 'reference']
      };

      dependencies.recipient.query.tables['project'] = {
        columns: ['abbr']
      };

      dependencies.recipient.query.join = ['patient.project_id=project.id'];

      dependencies.ledger.query = 'ledgers/debitor/' + invoice_data.debitor_uuid;
      return validate.process(dependencies, ['recipient']).then(buildLocationQuery);
    }

    function buildLocationQuery(model) {
      var recipient_data = model.recipient.data[0];

      dependencies.location.query = 'location/' + recipient_data.current_location_id;
      return validate.process(dependencies).then(invoice);
    }

    function invoice(model) {
      var routeCurrencyId;
      //Expose data to template
      $scope.model = model;

      $scope.session = {};
      console.log('session', $scope.session, 'model', model);
      $scope.session.currentCurrency = $scope.model.currency.get($scope.project.currency_id);
      console.log('currentcurr', $scope.session.currentCurrency);
      routeCurrencyId = $scope.session.currentCurrency.currency_id;

      //Default sale receipt should only contain one invoice record - kind of a hack for multi-invoice cash payments
      $scope.invoice = $scope.model.invoice.data[$scope.model.invoice.data.length-1];
      $scope.invoice.totalSum = 0;
      console.log('LEDGER', $scope.model.ledger);
      $scope.invoice.ledger = $scope.model.ledger.get($scope.invoice.uuid);

      $scope.recipient = $scope.model.recipient.data[0];
      $scope.recipient.location = $scope.model.location.data[0];

      // Human readable ID
      $scope.recipient.hr_id = $scope.recipient.abbr.concat($scope.recipient.reference);
      $scope.invoice.hr_id = $scope.invoice.abbr.concat($scope.invoice.reference);

      console.log('INVOICE', $scope.invoice);

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

    function patientReceipt(model) {
      $scope.model = model;
      $scope.recipient = $scope.model.recipient.data[0];
      $scope.location = $scope.model.location.data[0];

      // Human readable ID
      $scope.recipient.hr_id = $scope.recipient.abbr.concat($scope.recipient.reference)
    }

    //TODO Follows the process credit hack
    function creditInvoice(model) {
      $scope.model = model;
      $scope.note = $scope.model.credit.data[0];
      $scope.location = $scope.model.location.data[0];
    }

    function updateCost(currency_id) {
      //console.log('updating cost');
      $scope.invoice.localeCost = exchange($scope.invoice.cost, currency_id);
      //console.log('cid', currency_id);
      $scope.invoice.localeBalance = exchange($scope.invoice.ledger.balance, currency_id);
      //console.log('ledger', $scope.model);

      console.log($scope.invoice.ledger.balance);
      $scope.invoice.ledger.localeCredit = exchange($scope.invoice.ledger.credit, currency_id);

      $scope.invoice.localeTotalSum = exchange($scope.invoice.totalSum, currency_id);

      $scope.model.invoiceItem.data.forEach(function (item) {
        item.localeCost = exchange((item.credit - item.debit), currency_id);
      });
    }

    $scope.updateCost = updateCost;
  }
]);
=======
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
>>>>>>> ae0918c4c616b21463e3a275fcaa7f1066c7578c
