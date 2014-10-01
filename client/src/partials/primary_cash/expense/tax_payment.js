angular.module('bhima.controllers')
.controller('primary_cash.tax_payment', [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  'appcache',
  'connect',
  'util',
  'exchange',
  '$q',
  'uuid',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, Appcache, connect, util, exchange, $q, uuid) {
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

    appstate.register('project', function (project) {
      $scope.project = project;               
        validate.process(dependencies, ['paiement_period', 'cashier'])
        .then(init, function (err) {
          messenger.danger(err.message + ' ' + err.reference);
        });     
    });

    function init (model) {
      session.model = model;
      cache.fetch('selectedItem')
      .then(function (selectedItem){
        if (!selectedItem) { throw new Error('Currency undefined'); }
        session.selectedItem = selectedItem;
        return cache.fetch('paiement_period');
      })
      .then(function (pp) {
        if(!pp) {
          throw new Error('Paiement period undefined');
        }
        session.pp = pp; 
        session.pp_label = formatPeriod (pp);

        dependencies.employees_payment = {
          query : '/getEmployeePayment/' + session.pp.id
        };

        if(dependencies.employees_payment){
          dependencies.employees_payment.processed = false;
        }
        
        return validate.process(dependencies, ['employees_payment']);
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

    function submit (emp) {
      var primary = {
        uuid          : uuid(),
        project_id    : $scope.project.id,
        type          : 'S',
        date          : util.sqlDate(new Date()),
        deb_cred_uuid : emp.id,
        deb_cred_type : 'C',
        account_id    : session.selectedItem.account_id,
        currency_id   : session.selectedItem.currency_id,
        cost          : emp.value,
        user_id       : session.model.cashier.data.id,
        description   : "Tax Payment " + '(' +emp.abbr+ ') : ' + emp.name + emp.postnom,
        cash_box_id   : session.cashbox,
        origin_id     : 7,
      };

      var primary_details = {
        uuid              : uuid(),
        primary_cash_uuid : primary.uuid,
        debit             : 0,
        credit            : primary.cost,
        document_uuid     : emp.uuid
      };

      var tax_paiement = {
        paiement_uuid : emp.uuid,
        tax_id : emp.tax_id,
        posted : 1
      };

      var result = confirm($translate.instant('PAYMENT_PERIOD.CONFIRM'));
      if(result){
        connect.post('primary_cash',[primary],['uuid'])
        .then(function () {
          return connect.post('primary_cash_item',[primary_details],['uuid']);
        })
        .then(function () {
          // A FIXE : Utilisation de $http au lieu de connect
          var formatObject = {
            table : 'tax_paiement',
            paiement_uuid : emp.uuid,
            tax_id : emp.tax_id
          };
          return $http
            .put('/setTaxPayment/', formatObject)
            .success(function (res) {
              console.log('Update Tax Payment success');
            });
        })
        .then(function () {
          messenger.success("success");
          validate.refresh(dependencies, ['employees_payment']);
        })
        .catch(function (err) {
          messenger.danger(err);
        });
      }
      
    }

    $scope.setCashAccount = setCashAccount; 
    $scope.formatPeriod = formatPeriod;
    $scope.setConfiguration = setConfiguration;
    $scope.reconfigure = reconfigure;
    $scope.submit = submit;
  }
]);
