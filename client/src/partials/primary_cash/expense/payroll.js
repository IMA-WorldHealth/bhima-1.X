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
        cache = new Appcache('payroll'), session = $scope.session = {configured : false, complete : false, data : {}};
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
      getPPConf()
      .then(getOffDayCount)
      .then(getHollyDayCount);
    }

    function getPPConf() {     

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
      };

      return validate.process(dependencies, ['paiement_period_conf']);
    }

    function getOffDayCount (model) {
      
      dependencies.offDays = {
        query : {
          tables : {
            'offday' : {
              columns : ['id', 'label', 'date', 'percent_pay']
            }
          },
          where : ['offday.date>=' + util.sqlDate(model.paiement_period.data[0].dateFrom), 'AND', 'offday.date<=' + util.sqlDate(model.paiement_period.data[0].dateTo)]
        }
      };     

      validate.process(dependencies, ['offDays'])
      .then(function (model) {
        var offdays = model.offDays.data;
        var pp_confs = model.paiement_period_conf.data;
        var nb_offdays = 0;

        offdays.forEach(function (offDay) {
          for(var i = 0; i < pp_confs.length; i++){
            if ((util.isDateAfter(offDay.date, pp_confs[i].weekFrom) || util.areDatesEqual(offDay.date, pp_confs[i].weekFrom)) &&
                (util.isDateAfter(pp_confs[i].weekTo, offDay.date) || util.areDatesEqual(offDay.date, pp_confs[i].weekTo))) {
              nb_offdays++;
            }
          }
        });

        session.data.off_day = nb_offdays;
      });
      return $q.when(model);
    }

    function getHollyDayCount (model) {
      dependencies.hollydays = {
        query : {
          tables : {
            'hollyday' : {
              columns : ['id', 'label', 'dateFrom', 'dateTo']
            }
          },
          where : [
                    'hollyday.dateFrom>=' + new Date(model.paiement_period.data[0].dateFrom).toISOString().slice(0, 10),
                    'AND',
                    'hollyday.dateFrom<=' + new Date(model.paiement_period.data[0].dateTo).toISOString().slice(0, 10),
                    'OR',
                    'hollyday.dateTo>=' + new Date(model.paiement_period.data[0].dateFrom).toISOString().slice(0, 10),
                    'AND',
                    'hollyday.dateTo<=' + new Date(model.paiement_period.data[0].dateTo).toISOString().slice(0, 10),
                    'OR',
                    'hollyday.dateFrom<=' + new Date(model.paiement_period.data[0].dateFrom).toISOString().slice(0, 10),
                    'AND',
                    'hollyday.dateTo>=' + new Date(model.paiement_period.data[0].dateTo).toISOString().slice(0, 10)
          ]
        }
      };     

      validate.process(dependencies, ['hollydays'])
      .then(function (model) {
        console.log(model);

        var hollydays = model.hollydays.data;
        var pp_confs = model.paiement_period_conf.data;
        var soms = [];

        hollydays.forEach(function (h) {
          var nb = 0;
          function getValue (ppc) {

            //paiement period config === ppc

            var date_pweekfrom = new Date(ppc.weekFrom);
            var date_pweekto = new Date(ppc.weekTo);

            var date_hdatefrom = new Date(h.dateFrom);
            var date_hdateto = new Date(h.dateTo);

            var num_pweekfrom = date_pweekfrom.setHours(0,0,0,0);
            var num_pweekto = date_pweekto.setHours(0,0,0,0);

            var num_hdatefrom = date_hdatefrom.setHours(0,0,0,0);            
            var num_hdateto = date_hdateto.setHours(0,0,0,0);

            var minus_right = 0, minus_left = 0;

            if(num_pweekto > num_hdateto){
              minus_right = date_pweekto.getDate() - date_hdateto.getDate();
              // console.log('minus_right', minus_right, 'period', ppc, 'hollyday', h);
            }

            if(num_pweekfrom < num_hdatefrom){
              minus_left = date_hdatefrom.getDate() - date_pweekfrom.getDate();
              // console.log('minus_left', minus_left, 'period', ppc, 'hollyday', h);
            }

            var total = date_pweekto.getDate() - date_pweekfrom.getDate();
            if(minus_left > total) return 0;
            if(minus_right > total) return 0;
            return total - (minus_left + minus_right);
          }

          pp_confs.forEach(function (ppc) {
            nb += getValue(ppc);
          });

          soms.push(nb);
          console.log('total est', soms);
        });

        session.data.holly_day = soms.reduce(function (x, y){
          return x+y;
        }, 0);        
      });
      return $q.when();
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
