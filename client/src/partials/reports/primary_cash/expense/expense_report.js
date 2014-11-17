angular.module('bhima.controllers')
.controller('primary_cash.expenseReport', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'validate',
  'messenger',
  'util',
  'appcache',
  'exchange',
  function ($scope, $q, connect, appstate, validate, messenger, util, Appcache,exchange) {
    var session = $scope.session = {};
    var dependencies = {};
    var cache = new Appcache('expense_report');
    session.dateFrom = new Date();
    session.dateTo = new Date();

    dependencies.cashes = {
      required: true,
      query : {
        tables : {
          'cash_box' : {
            columns : ['text', 'project_id']
          },
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'cash_box_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol']
          }
        },
        join : ['cash_box.id=cash_box_account_currency.cash_box_id', 'currency.id=cash_box_account_currency.currency_id' ]
      }
    };
    dependencies.records = {}; 

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
    };   

    cache.fetch('selectedCash').then(load);

    function load (selectedCash) {
      if (selectedCash) { session.selectedCash = selectedCash; }
      
      appstate.register('project', function(project) {
        session.project = project;
        dependencies.cashes.query.where = ['cash_box.project_id=' + project.id, 'AND', 'cash_box.is_auxillary=0'];
        validate.process(dependencies, ['cashes'])
        .then(init)
        .catch(function (err) {
          messenger.danger(err.toString());
        });
      });
    }

    function init (model) {
      $scope.session.model = model;
      if(session.selectedCash){
        fill();
      }
    }

    function setSelectedCash (obj) {
      session.selectedCash = obj;
      cache.put('selectedCash', obj);
      fill();
    }

    function fill () {
      var request;

      request = {
        dateFrom : util.sqlDate(session.dateFrom),
        dateTo : util.sqlDate(session.dateTo),
        account_id : session.selectedCash.account_id
      };

      dependencies.records.query = '/reports/expense_report/?' + JSON.stringify(request);      
      validate.refresh(dependencies, ['records','currencies'])
      .then(prepareReport)
      .then(convert)
      .catch(function (err) {
       messenger.danger(err.toString());
      });
    }

    function prepareReport (model) {
      session.model = model;
      //Currencies
      $scope.currencies = session.model.currencies;
      session.currency = session.project.currency_id;

      console.log('records : ',model.records.data);
    }

    $scope.setSelectedCash = setSelectedCash;
    $scope.fill = fill;

    function convert (){
      session.sum_credit = 0;
      if(session.model.records.data) {   
        session.model.records.data.forEach(function (transaction) {
          if((transaction.service_txt === 'indirect_purchase')){
            transaction.primary_cash_uuid = transaction.document_uuid;
          } else if((transaction.service_txt === 'payroll') || (transaction.service_txt === 'tax_payment') || (transaction.service_txt === 'cotisation_paiement')){
            transaction.primary_cash_uuid = transaction.document_uuid;
          }

          console.log('trans :::', transaction);
          session.sum_credit += exchange.convertir(transaction.credit, transaction.currency_id, session.currency, new Date()); // FIX ME : appstate return only the dailyexchange rate, it should be transaction.trans_date
          console.log('From '+transaction.currency_id+' To '+session.currency);
        });        
      }
    }
    $scope.convert = convert;
  }
]);
