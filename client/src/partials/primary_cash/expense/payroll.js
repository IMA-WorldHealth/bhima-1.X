angular.module('bhima.controllers')
.controller('payroll', [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  'connect',
  '$location',
  'util',
  'appcache',
  'exchange',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, connect, $location, util, Appcache, exchange) {
    var dependencies = {},
        cache = new Appcache('payroll'), session = $scope.session = {configured : false, complete : false};
    session.cashbox = $routeParams.cashbox;
    session.selectedEmployee = {};

    dependencies.cash_box = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          },
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          }
        },
        join : [
          'cash_box_account_currency.currency_id=currency.id',
          'cash_box_account_currency.cash_box_id=cash_box.id'
        ],
        where : [
          'cash_box_account_currency.cash_box_id=' + session.cashbox
        ]
      }
    };

    dependencies.exchange_rate = {
      required : true,
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'date', 'rate']
          }
        },
        where : ['exchange_rate.date='+util.convertToMysqlDate(new Date())]
      }
    };

    dependencies.cashier = {
      query : 'user_session'
    };

    dependencies.paiement_period = {
      query : {
        tables : {
          'paiement_period' : {
            columns : ['id', 'config_tax_id', 'config_rubric_id', 'label', 'dateFrom', 'dateTo']
          }
        }
      }
    }

    dependencies.pcash_module = {
      required : true,
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text=Payroll']
      }
    };

    dependencies.enterprise = {
      query : {
        tables : {
          'enterprise' : {
          columns : ['currency_id']
        }
        }
      }
    };

    cache.fetch('paiement_period').then(readConfig);
    cache.fetch('selectedItem').then(load);
    

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(init, function (err) {
         $translate('PRIMARY_CASH.EXPENSE.LOADING_ERROR')
          .then(function (value) {
            messenger.danger(value);
          }); 
      });     
    });

    function load (selectedItem) {
      if (!selectedItem) { return ; }
      session.loading_currency_id = selectedItem.currency_id;
      session.selectedItem = selectedItem;
    }   

    function readConfig (pp) {
      if(pp){
        session.pp = pp;
        session.configured = true;
        session.complete = true;
      }
    }


    function reconfigure() {
      cache.remove('paiement_period');
      session.pp = null;
      session.configured = false;
      session.complete = false;
    } 

    function init (model) {
      session.model = model;
    }

    function setCashAccount(cashAccount) {
      if (cashAccount) {
        session.loading_currency_id = session.selectedItem.currency_id;
        session.selectedItem = cashAccount;        
        cache.put('selectedItem', cashAccount);
      }
    }

    function initialiseEmployee (selectedEmployee) {
      session.isEmployeeSelected = selectedEmployee ? selectEmployee(selectedEmployee) : false;      
    }

    function formatPeriod (pp) {
      return [pp.label, util.sqlDate(pp.dateFrom), util.sqlDate(pp.dateTo)].join(' / ');
    }

    function setConfiguration (pp) {
      cache.put('paiement_period', pp);
      session.configured = true;
      session.pp = pp;
      session.complete = true;
    }


    function selectEmployee (employee) {
      session.selectedEmployee = employee; 
      session.selectedEmployee.basic_salary = exchange.convertir(session.selectedEmployee.basic_salary, 2, session.selectedItem.currency_id, util.sqlDate(new Date()));    // FIX ME : hack enterprise currency      
      return true;
    }

    $scope.$watch('session.selectedItem', function (nval, oval) {
      if(session.isEmployeeSelected){
        session.selectedEmployee.basic_salary = exchange.convertir(session.selectedEmployee.basic_salary, session.loading_currency_id, session.selectedItem.currency_id, util.sqlDate(new Date()));      
      }     
    }, true);

    $scope.setCashAccount = setCashAccount;  
    $scope.initialiseEmployee = initialiseEmployee; 
    $scope.formatPeriod = formatPeriod;
    $scope.setConfiguration = setConfiguration;
    $scope.reconfigure = reconfigure;
  }
]);
