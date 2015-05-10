angular.module('bhima.controllers')
.controller('cash.extra_payment', [
  '$q',
  '$scope',
  '$http',
  '$routeParams',
  '$translate',
  'validate',
  'messenger',
  'appstate',
  'connect',
  'uuid',
  'util',
  'appcache',
  '$location',
  'exchange',
  function ($q, $scope, $http, $routeParams, $translate, validate, messenger, appstate, connect, uuid, util, Appcache, $location, exchange) {
    var isDefined, dependencies = {},
        session = $scope.session = { receipt : { date : new Date() }, configure : false, complete : false },
        saleData = $scope.saleData = [],
        cache = new Appcache('extra');

    dependencies.sales = {
      query : {
        tables : {
          'sale' : {
            columns : ['uuid', 'debitor_uuid']
          },
          'patient' : {
            columns : ['first_name', 'middle_name', 'last_name']
          }
        },
        join : ['sale.debitor_uuid=patient.debitor_uuid']
      }
    };    

    dependencies.currencies = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol']
          }
        }
      }
    };

    dependencies.user = {
      query : '/user_session/'
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' :{
            columns : ['id', 'account_txt', 'account_number']
          }
        },
        where : ['account.classe=4']
      }
    };

    cache.fetch('currency').then(load);
    cache.fetch('account').then(getAccount);

    appstate.register('project', function (project) {
      $scope.project =  project;
      validate.process(dependencies)
      .then(init)
      .then(getSale)
      .catch(function (err) {
        messenger.danger(err);
      });
    });

    function getSale (data) {
      $scope.saleData = [];
      data.forEach(function (sale) {
        $http.get('/ledgers/debitor/'+sale.debitor_uuid)
        .success(function (rows) {
          var items = rows.filter(function (row) {
            return row.balance > 0;
          });
          items.forEach(function (row) {
            row.debitor_first = sale.first_name;
            row.debitor_middle = sale.middle_name;
            row.debitor_last = sale.last_name;
            row.transaction = row.abbr + row.reference;
            row.cost = row.balance;
            row.currency = 2; // values are always in $
            row.currency_id = 2; // values are always in $
          });
          $scope.saleData = items;
        });
      });
    }

    function submit (sale) {
      var details = {
        user_id      : $scope.user.data.id,
        project_id   : $scope.project.id,
        sale_uuid     : sale.inv_po_id,
        wait_account : session.ac.id,
        debitor_uuid : sale.deb_cred_uuid,
        cost         : sale.cost || 0,
        currency_id  : sale.currency_id
      };
      $http.post('/extraPayment/', {
        params : {
          user_id : details.user_id,
          sale_uuid : details.sale_uuid,
          details : details
        }
      })
      .success( function() {
        validate.refresh(dependencies)
        .then(init)
        .then(getSale)
        .then(function () {
          messenger.success($translate.instant('UTIL.SUCCESS'), true);
        })
        .catch(function (err) {
          messenger.danger(err);
        });
      });
    }

    function init (models) {
      angular.extend($scope, models);
      session.accounts = models.accounts.data;
      return $scope.sales.data;
    }

    function load (currency) {
      if (!currency) { return; }
      session.currency = currency;
    }

    function getAccount (ac) {
      if (!ac) { return; }
       session.configured = true;
       session.ac = ac;
       session.complete = true;
    }

    function setCurrency (obj) {
      if (obj.currency === 1 && obj.currency_id === 2) {
        obj.balance = obj.balance * exchange.rate(null, obj.currency);
        obj.cost = obj.balance;
        obj.currency_id=obj.currency;
      } else if (obj.currency === 2 && obj.currency_id === 1) {
        obj.balance = obj.balance / exchange.rate(null, obj.currency_id);
        obj.cost = obj.balance;
        obj.currency_id=obj.currency;
      }

    }

    $scope.formatAccount = function (ac) {
      if(ac){return ac.account_number + ' - ' + ac.account_txt;}
    };

    $scope.reconfigure = function () {
      session.configured = false;
      session.ac = null;
      session.complete = false;
    };

    $scope.setConfiguration = function (ac) {
      if(ac){
        cache.put('account', ac);
        session.configured = true;
        session.ac = ac;
        session.complete = true;
      }
    };

    $scope.setCurrency = setCurrency;
    $scope.submit = submit;
  }
]);
