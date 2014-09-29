angular.module('bhima.controllers')
.controller('primary_cash.tax_payment', [
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
  'ipr',
  'uuid',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, connect, $location, util, Appcache, exchange, $q, ipr, uuid) {
    var dependencies = {},
        cache = new Appcache('tax_payment'),
        session = $scope.session = {
          configured : false, 
          complete : false, 
          data : {}, 
          selectedItem : {}, 
          rows : []
        };

    session.cashbox = $routeParams.cashbox;

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
        where : ['exchange_rate.date='+util.sqlDate(new Date())]
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
    };

    dependencies.pcash_module = {
      required : true,
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text=Tax Payment']
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

    dependencies.paiements = {
      query : {
        tables : {
          'paiement' : {
            columns : ['uuid', 'employee_id']
          }
        }        
      }
    };

    appstate.register('project', function (project) {
      $scope.project = project;               
        validate.process(dependencies, ['enterprise', 'pcash_module', 'paiement_period', 'cashier', 'exchange_rate', 'cash_box'])
        .then(init, function (err) {
          messenger.danger(err.message + ' ' + err.reference);
          console.log('ko', err);
          $translate('PRIMARY_CASH.EXPENSE.LOADING_ERROR')
          .then(function (value) {
            messenger.danger(value);
          }); 
        });     
    });

    function init (model) {
      session.model = model;
      cache.fetch('selectedItem')
      .then(function (selectedItem){
        if (!selectedItem) { throw new Error('Currency undefined'); }
        session.loading_currency_id = selectedItem.currency_id;
        session.selectedItem = selectedItem;
        return cache.fetch('paiement_period');
      })
      .then(function (pp) {
        if(!pp) {
          throw new Error('Paiement period undefined');
        }
        session.pp = pp; 
        session.pp_label = formatPeriod (pp);

        dependencies.paiements.query.where = ['paiement.paiement_period_id=' + session.pp.id];
        dependencies.employees = {
          query : {
            tables : {
              employee : { columns : ['id','prenom','name','postnom']},
              paiement : { columns : ['paiement_date']}
            },
            join : ['employee.id=paiement.employee_id'],
            where : ['paiement.paiement_period_id=' + session.pp.id]
          }
        };

        if(dependencies.paiements) {
          dependencies.paiements.processed = false;
        }

        if(dependencies.employees){
          dependencies.employees.processed = false;
        }
        
        return validate.process(dependencies, ['employees', 'paiements']);
      })
      .then(function (model) {
        session.model = model;
        session.configured = true;
        session.complete = true;
      })
      .catch(function (err) {
        messenger.danger(err.message);
        console.log('err', err);
      });
    }

    function reconfigure() {
      cache.remove('paiement_period');
      session.pp = null;
      session.configured = false;
      session.complete = false;
    }

    function formatPeriod (pp) {
      return [pp.label, util.sqlDate(pp.dateFrom), util.sqlDate(pp.dateTo)].join(' / ');
    }

    function setConfiguration (pp) {
      if(pp){
        cache.put('paiement_period', pp);
        session.configured = true;
        session.pp = pp;
        session.complete = true;
        init(session.model);
      }            
    }

    function setCashAccount(cashAccount) {
      if (cashAccount) {
        session.loading_currency_id = session.selectedItem.currency_id || session.model.enterprise.data[0].currency_id;
        var reload = session.selectedItem.currency_id ? false : true;
        session.selectedItem = cashAccount;        
        cache.put('selectedItem', cashAccount);
        if(reload){
          init(session.model);
        }
      }
    }

    $scope.setCashAccount = setCashAccount; 
    $scope.formatPeriod = formatPeriod;
    $scope.setConfiguration = setConfiguration;
    $scope.reconfigure = reconfigure;
  }
]);
