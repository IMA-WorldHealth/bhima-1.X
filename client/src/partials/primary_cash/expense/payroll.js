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
  '$q',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, connect, $location, util, Appcache, exchange, $q) {
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

    cache.fetch('paiement_period')
    .then(readConfig)
    .then(load)
    .then(function () {
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
    });
   

    function load (selectedItem) {
      if (!selectedItem) { return ; }
      session.loading_currency_id = selectedItem.currency_id;
      session.selectedItem = selectedItem;
      return $q.when();
    }   

    function readConfig (pp) {
      if(pp){
        session.pp = pp;
        session.configured = true;
        session.complete = true;
      }
      return cache.fetch('selectedItem');
    }


    function reconfigure() {
      cache.remove('paiement_period');
      session.pp = null;
      session.configured = false;
      session.complete = false;
      session.isEmployeeSelected = false;
    } 

    function init (model) {
      session.model = model;
      getOffDayCount();
    }

    function getOffDayCount () {
      console.log('pp',session.pp);
      dependencies.offDays = {
        required : true,
        query : {
          tables : {
            'offday' : {
              columns : ['id', 'label', 'date', 'percent_pay']
            }
          },
          where : ['offday.date>=' + util.sqlDate(session.pp.dateFrom), 'AND', 'offday.date<=' + util.sqlDate(session.pp.dateTo)]
        }
      }

      dependencies.paiement_period_conf = {
        required : true,
        query : {
          tables : {
            'config_paiement_period' : {
              columns : ['id', 'weekFrom', 'weekTo']
            }
          },
          where : ['config_paiement_period.paiement_period_id>=' + session.pp.id]
        }
      }

      validate.process(dependencies)
      .then(function (model) {
        console.log('model',model);

      })


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
      console.log('set pp', pp);
      cache.put('paiement_period', pp);
      session.configured = true;
      session.pp = pp;
      session.complete = true;
    }


    function selectEmployee (employee) {
      session.selectedEmployee = employee; 
      session.selectedEmployee.basic_salary = exchange.convertir(session.selectedEmployee.basic_salary, session.model.enterprise.data[0].currency_id, session.selectedItem.currency_id, util.sqlDate(new Date()));     
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
