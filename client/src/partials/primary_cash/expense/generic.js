angular.module('bhima.controllers')
.controller('primaryCash.expense.generic', [
  '$scope',
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
  function ($scope, $routeParams, $translate, validate, messenger, appstate, connect, uuid, util, Appcache, $location) {
    var isDefined, dependencies = {};
    var session = $scope.session = { receipt : { date : new Date() }, configure : false, complete : false };
    var cache = new Appcache('expense');

    // TODO
    if (Number.isNaN(Number($routeParams.id))) {
      throw new Error('No cashbox selected');
    }

    isDefined = angular.isDefined;

    $scope.timestamp = new Date();

    session.today = $scope.timestamp.toISOString().slice(0, 10);

    dependencies.suppliers = {
      query : {
        tables : {
          'supplier' : {
            columns : ['uuid', 'creditor_uuid', 'name', 'address_1', 'address_2', 'location_id', 'email']
          },
          'creditor' : {
            columns : ['text']
          },
          'creditor_group' : {
            columns : ['account_id']
          }
        },
        join : ['supplier.creditor_uuid=creditor.uuid', 'creditor.group_uuid=creditor_group.uuid']
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

    dependencies.accounts = {
      query : {
        tables : {
          'account' :{
            columns : ['id', 'account_txt', 'account_number', 'is_ohada']
          }
        },
        where : ['account.is_ohada=1', 'AND', 'account.account_type_id<>3']
      }
    };

    cache.fetch('currency').then(load);
    cache.fetch('account').then(getAccount);

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

    appstate.register('project', function (project) {
      $scope.project =  project;
      validate.process(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
        session.receipt.date = new Date();
        session.receipt.cost = 0.00;
        session.receipt.cash_box_id = $routeParams.id;

        session.accounts = models.accounts.data;
      })
      .catch(function (err) {
        messenger.danger(err);
      });
    });

    $scope.generate = function generate () {
      session.receipt.reference_uuid = uuid();
    };

    $scope.clear = function clear () {
      session.receipt = {};
      session.receipt.date = new Date();
      session.receipt.value = 0.00;
      session.receipt.cash_box_id = $routeParams.id;
    };

    function valid () {
      if (!session || !session.receipt) {
        session.invalid = true;
        return;
      }
      var r = session.receipt;

      session.invalid = !(isDefined(session.currency) &&
        isDefined(r.cost) &&
        r.cost > 0 &&
        isDefined(r.description) &&
        isDefined(r.date) &&
        isDefined(r.cash_box_id));
    }

    $scope.$watch('session.receipt', valid, true);
    $scope.$watch('session.currency', valid, true);

    $scope.submit = function submit () {
      var data, receipt = session.receipt;

      connect.fetch('/user_session')
      .then(function (user) {

        data = {
          uuid          : uuid(),
          reference     : 1,
          project_id    : $scope.project.id,
          type          : 'E',
          date          : util.sqlDate(receipt.date),
          account_id    : session.ac.id,
          currency_id   : session.currency.id,
          cost          : receipt.cost,
          user_id       : user.id,
          description   : 'HBB' + '_C.P DEP GEN/' + receipt.description, //fix me
          cash_box_id   : receipt.cash_box_id,
          origin_id     : 4,
        };

        return connect.basicPut('primary_cash', [data]);
      })
      .then(function () {
        var item = {
          uuid              : uuid(),
          primary_cash_uuid : data.uuid,
          debit             : 0,
          credit            : data.cost,
          document_uuid     : receipt.reference_uuid
        };
        return connect.basicPut('primary_cash_item', [item]);
      })
      .then(function () {
        return connect.fetch('/journal/primary_expense/' + data.uuid);
      })
       .then(function () {
        // invoice
        messenger.success($translate.instant('ALLTRANSACTIONS.DATA_POSTED'));
        $location.path('/invoice/generic_expense/' + data.uuid);
      });
    };

    function setCurrency (obj) {
      session.currency=obj;
      cache.put('currency', obj);
    }

    function update (value) {
      session.receipt.recipient = value;
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

    $scope.update = update;
    $scope.setCurrency = setCurrency;
  }
]);
