angular.module('bhima.controllers')
.controller('receipt.cash', [
  '$scope',
  '$routeParams',
  '$q',
  '$http',
  'validate',
  'exchange',
  'appstate',
  'util',
  'connect',
  'messenger',
  function ($scope, $routeParams, $q, $http, validate, exchange, appstate, util, connect, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.cash = {
      query : {
        identifier : 'uuid',
        tables: {
          cash: { columns: ['uuid', 'date', 'cost', 'deb_cred_uuid', 'currency_id'] },
          cash_item: { columns: ['cash_uuid', 'allocated_cost', 'invoice_uuid'] },
          sale: { columns : ['reference']}
        },
        join: ['cash_item.cash_uuid=cash.uuid', 'cash_item.invoice_uuid=sale.uuid']
      }
    };

    function buildInvoiceQuery(model) {
      var invoiceCondition = dependencies.invoice.query.where = [];
      var invoiceItemCondition = dependencies.invoiceItem.query.where = [];

      model.cash.data.forEach(function(invoiceRef, index) {

        if (index!==0) {
          invoiceCondition.push('OR');
        }

        invoiceCondition.push('sale.uuid=' + invoiceRef.invoice_uuid);
        invoiceItemCondition.push('sale_item.sale_uuid=' + invoiceRef.invoice_uuid);
        if (index !== model.cash.data.length - 1) {
          invoiceItemCondition.push('OR');
        }
      });

      dependencies.invoice.query.where = invoiceCondition;
      dependencies.invoiceItem.query.where = invoiceItemCondition;

      processSale();
    }

    function processSale() {
      validate.process(dependencies, ['invoice', 'invoiceItem'])
      .then(buildRecipientQuery);
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

      dependencies.location.query = 'location/detail/' + recipient_data.current_location_id;
      return validate.process(dependencies).then(invoice);
    }

    function invoice(model) {
      var routeCurrencyId;
      //Expose data to template
      $scope.model = model;

      $scope.session = {};
      $scope.session.currentCurrency = $scope.model.currency.get($scope.project.currency_id);
      routeCurrencyId = $scope.session.currentCurrency.currency_id;

      //Default sale receipt should only contain one invoice record - kind of a hack for multi-invoice cash payments
      $scope.invoice = $scope.model.invoice.data[$scope.model.invoice.data.length-1];
      $scope.invoice.totalSum = 0;
      $scope.invoice.ledger = $scope.model.ledger.get($scope.invoice.uuid);

      $scope.recipient = $scope.model.recipient.data[0];
      $scope.recipient.location = $scope.model.location.data[0];
      //FIXME huge total hack
      $scope.model.invoice.data.forEach(function(invoiceRef) {
        $scope.invoice.totalSum += invoiceRef.cost;
      });
      // Human readable ID
      $scope.recipient.hr_id = $scope.recipient.abbr.concat($scope.recipient.reference);
      $scope.invoice.hr_id = $scope.invoice.abbr.concat($scope.invoice.reference);


      //FIXME hacks for meeting
      if (model.cash) {
        $scope.cashTransaction  = $scope.model.cash.data[0];
        routeCurrencyId = $scope.cashTransaction.currency_id;
      }

      updateCost(routeCurrencyId);
    }

    function updateCost(currency_id) {
      $scope.invoice.localeCost = exchange($scope.invoice.cost, currency_id, $scope.invoice.invoice_date);
      if ($scope.invoice.ledger)  {
        $scope.invoice.localeBalance = exchange($scope.invoice.ledger.balance, currency_id, $scope.invoice.invoice_date);
        $scope.invoice.ledger.localeCredit = exchange($scope.invoice.ledger.credit, currency_id, $scope.invoice.invoice_date);
      }

      $scope.invoice.localeTotalSum = exchange($scope.invoice.totalSum, currency_id, $scope.invoice.invoice_date);

      $scope.model.invoiceItem.data.forEach(function (item) {
        item.localeTransaction = exchange(item.transaction_price, currency_id, $scope.invoice.invoice_date);
        item.localeCost = exchange((item.credit - item.debit), currency_id, $scope.invoice.invoice_date);
      });
    };

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.cash.query.where = ['cash_item.cash_uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);