//TODO Debtor table currently has no personal information - this strictly ties debtors to patients (or some existing table) - a reverse lookup from debtor/ creditor ID to recipient is needed
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

    dependencies.ledger = {
      identifier: 'inv_po_id'
    };

    dependencies.location = {
      required: true
    };

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

    function processCaution (caution_uuid){
      dependencies.caution = {
        required: true,
        query:  {
          tables: {
            caution: { columns: ['reference', 'value', 'debitor_uuid', 'project_id', 'currency_id', 'date'] },
            patient : {columns : ['first_name', 'last_name', 'current_location_id']}
          },
          join : ['caution.debitor_uuid=patient.debitor_uuid'],
          where: ['caution.uuid=' + caution_uuid]
        }
      };
      validate.process(dependencies, ['caution']).then(buildCaution);
    }

    function buildCaution (model) {
      dependencies.location = {
        required: true,
        query: '/location/' + model.caution.data[0].current_location_id
      };

      validate.process(dependencies, ['location'])
      .then(cautionInvoice);
    }

    function buildPatientLocation(model) {
      dependencies.location = {
        required: false
      };

      dependencies.ledger = {
        identifier: 'inv_po_id'
      };
    }


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

    function processPurchase() { 
      dependencies.purchase = { 
        query : { 
          tables : { 
            purchase : { columns : ['uuid', 'reference', 'cost', 'currency_id', 'creditor_uuid', 'invoice_date', 'note', 'employee_id'] } 
          }
        },
        where : ['purchase.uuid=' + invoiceId]
      };

      dependencies.purchaseItem = { 
        query : { 
          tables : { 
            purchase_item : { columns : ['uuid', 'inventory_uuid', 'purchase_uuid', 'quantity', 'unit_price', 'total'] },
            inventory : { columns : ['code', 'text'] }
          },
          join : ['purchase_item.inventory_uuid=inventory.uuid'],
          where : ['purchase_item.purchase_uuid=' + invoiceId + '']
        }
      };

      validate.process(dependencies, ['purchase', 'purchaseItem']).then(processPurchaseParties);
    }

    function processPurchaseParties(model) { 
      var creditor = model.purchase.data[0].creditor_uuid;
      var employee = model.purchase.data[0].employee_id;

      dependencies.supplier = { 
        query : { 
          tables : { 
            creditor : { columns : ['group_uuid'] },
            supplier : { columns : ['uuid', 'name', 'location_id', 'email', 'fax', 'note', 'phone', 'international'] } 
          },
          join : ['creditor.uuid=supplier.creditor_uuid'],
          where : ['creditor.uuid=' + creditor]
        }
      };
      
      dependencies.employee = { 
        query : { 
          tables : { 
            employee : { columns : ['name', 'code', 'dob', 'creditor_uuid'] }
          },
          where : ['employee.id=' + employee]
        }
      };

      validate.process(dependencies, ['supplier', 'employee']).then(processPurchaseDetails);
    }

    function processPurchaseDetails(model) { 
      var locationId = model.supplier.data[0].location_id;

      dependencies.supplierLocation = { 
        query : '/location/' + locationId
      };

      validate.process(dependencies, ['supplierLocation']).then(initialisePurchase);
    }

    function initialisePurchase(model) { 
      console.log('final', model);
      $scope.model = model;

      $scope.purchase = model.purchase.data[0];
      $scope.supplier = model.supplier.data[0];
      $scope.employee = model.employee.data[0];
      $scope.supplierLocation = model.supplierLocation.data[0];
    }

    //TODO this process is kind of a hack
    function processCredit(invoiceId) {
      dependencies = {};
      dependencies.credit = {
        required: true,
        query: {
          tables: {
            credit_note: { columns: ['uuid', 'cost', 'debitor_uuid', 'seller_id', 'sale_uuid', 'note_date', 'description'] },
            patient: { columns: ['first_name', 'last_name', 'current_location_id', 'reference'] },
            project: { columns: ['abbr'] }
          },
          join: ['credit_note.debitor_uuid=patient.debitor_uuid'],
          where: ['credit_note.uuid=' + invoiceId]
        }
      };
      validate.process(dependencies, ['credit']).then(buildCreditRecipient);
    }

    function processDebtor() {
      messenger.danger('Method not implemented');
    }

    function processPatient() {
      dependencies.recipient.query = {
        tables: {},
        where: [
          'patient.uuid=' + invoiceId
        ]
      };

      dependencies.recipient.query.tables['patient'] = {
        columns: ['uuid', 'reference', 'first_name', 'last_name', 'dob', 'current_location_id', 'debitor_uuid', 'registration_date']
      };

      dependencies.recipient.query.tables['project'] = {
        columns: ['abbr']
      };


      dependencies.recipient.query.join = ['patient.project_id=project.id'];

      validate.process(dependencies, ['recipient']).then(buildPatientLocation);
    }

    function buildPatientLocation(model) {
      dependencies.location = {
        required: true,
        query: '/location/' + model.recipient.data[0].current_location_id
      };

      validate.process(dependencies, ['location']).then(patientReceipt);
    }

    function buildInvoiceQuery(model) {
      var cash_data = [];
      var invoiceCondition = dependencies.invoice.query.where = [];
      var invoiceItemCondition = dependencies.invoiceItem.query.where = [];

      model.cash.data.forEach(function(invoiceRef, index) {
        console.log('invoice ref', invoiceRef);

        if(index!==0) {
          invoiceCondition.push('OR');
        }

        invoiceCondition.push("sale.uuid=" + invoiceRef.invoice_uuid);
        invoiceItemCondition.push("sale_item.sale_uuid=" + invoiceRef.invoice_uuid);
        if (index !== model.cash.data.length - 1) {
          invoiceItemCondition.push("OR");
        }
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
        tables: {
          'patient' : {
            columns: ['first_name', 'last_name', 'dob', 'current_location_id', 'reference', 'registration_date']
          },
          'project' : {
            columns: ['abbr']
          },
          'debitor' : {
            columns: ['text']
          },
          'debitor_group' : {
            columns : ['name', 'is_convention'],
          }
        },
        where: [
          'patient.debitor_uuid=' + invoice_data.debitor_uuid,
        ],
        join : [
          'patient.project_id=project.id',
          'patient.debitor_uuid=debitor.uuid',
          'debitor.group_uuid=debitor_group.uuid'
        ]
      };

      dependencies.ledger.query = 'ledgers/debitor/' + invoice_data.debitor_uuid;
      return validate.process(dependencies, ['recipient'])
      .then(buildLocationQuery);
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
      $scope.session.currentCurrency = $scope.model.currency.get($scope.project.currency_id);
      routeCurrencyId = $scope.session.currentCurrency.currency_id;
      
      //Default sale receipt should only contain one invoice record - kind of a hack for multi-invoice cash payments
      $scope.invoice = $scope.model.invoice.data[$scope.model.invoice.data.length-1];
      console.log('The Invoice is:', $scope.invoice);
      $scope.invoice.totalSum = 0;
      console.log("[LEDGEER]", $scope.model.ledger);
      $scope.invoice.ledger = $scope.model.ledger.get($scope.invoice.uuid);
      console.log('[get.invoice.id] a donnee :', $scope.invoice.ledger);

      $scope.recipient = $scope.model.recipient.data[0];
      $scope.recipient.location = $scope.model.location.data[0];
      //FIXME huge total hack
      $scope.model.invoice.data.forEach(function(invoiceRef) {
        $scope.invoice.totalSum += invoiceRef.cost;
      });
      // Human readable ID
      $scope.recipient.hr_id = $scope.recipient.abbr.concat($scope.recipient.reference);
      $scope.invoice.hr_id = $scope.invoice.abbr.concat($scope.invoice.reference);

      console.log('INVOICE', $scope.invoice);

      //FIXME hacks for meeting
      if (model.cash) {
        $scope.cashTransaction  = $scope.model.cash.data[0];
        routeCurrencyId = $scope.cashTransaction.currency_id;
      }

      $scope.updateCost(routeCurrencyId);
    }

    function patientReceipt(model) {
      $scope.model = model;
      $scope.recipient = $scope.model.recipient.data[0];
      $scope.location = $scope.model.location.data[0];

      // Human readable ID
      $scope.recipient.hr_id = $scope.recipient.abbr.concat($scope.recipient.reference);
    }

    //TODO Follows the process credit hack
    function creditInvoice(model) {
      $scope.model = model;
      $scope.note = $scope.model.credit.data[0];
      $scope.location = $scope.model.location.data[0];
    }

    $scope.updateCost = function updateCost(currency_id) {
      $scope.invoice.localeCost = exchange($scope.invoice.cost, currency_id, $scope.invoice.invoice_date);
      if ($scope.invoice.ledger)  {
        $scope.invoice.localeBalance = exchange($scope.invoice.ledger.balance, currency_id, $scope.invoice.invoice_date);
        $scope.invoice.ledger.localeCredit = exchange($scope.invoice.ledger.credit, currency_id, $scope.invoice.invoice_date);
      } else {
        console.error('[invoice.js] Unable to find ledger - ledger returned nothing');
      }

      $scope.invoice.localeTotalSum = exchange($scope.invoice.totalSum, currency_id, $scope.invoice.invoice_date);

      $scope.model.invoiceItem.data.forEach(function (item) {
        item.localeTransaction = exchange(item.transaction_price, currency_id, $scope.invoice.invoice_date);
        item.localeCost = exchange((item.credit - item.debit), currency_id, $scope.invoice.invoice_date);
      });
    };

    function convert (value, currency_id, date) {
      return value / exchange.rate(value, currency_id, date);
    }

    $scope.filterCash = function filterCash(item, invoice) {
      return item.sale_uuid === invoice.invoice_uuid;
    };

    function cautionInvoice (model) {
      $scope.model = model;
      $scope.location = $scope.model.location.data[0];
      $scope.caution = $scope.model.caution.data[0];
      //console.log('notre caution', $scope.caution);
    }

    process = {
      'cash'    : processCash,
      'caution' : processCaution,
      'sale'    : processSale,
      'credit'  : processCredit,
      'debtor'  : processDebtor,
      'patient' : processPatient,
      'purchase': processPurchase,
    };

    appstate.register('project', function (project) {
      $scope.project = project;
      process[origin](invoiceId);
    });

    $scope.convert = convert;
  }
]);
