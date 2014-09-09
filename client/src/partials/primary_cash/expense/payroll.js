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
        cache = new Appcache('payroll'), session = $scope.session = {};
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

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id','account_number', 'account_txt']
          }
        }
      }
    };

    dependencies.cashier = {
      query : 'user_session'
    };

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

    cache.fetch('selectedItem').then(load);

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.accounts.query.where = ['account.enterprise_id=' + project.enterprise_id];
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
  }
]);
