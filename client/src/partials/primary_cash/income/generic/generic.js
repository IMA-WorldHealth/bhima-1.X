angular.module('bhima.controllers')
.controller('primaryCash.income.generic', [
  '$scope',
  '$routeParams',
  '$translate',
  'validate',
  'messenger',
  'appstate',
  'connect',
  'uuid',
  'util',
  '$location',
  'appcache',
  function ($scope, $routeParams, $translate, validate, messenger, appstate, connect, uuid, util, $location, Appcache) {
    var isDefined, dependencies = {};
    var session = $scope.session = { receipt : {}, configured : false, complete : false };
    var cache = new Appcache('income');

    // TODO
    if (Number.isNaN(Number($routeParams.id))) {
      throw new Error('No cashbox selected');
    }

    isDefined = angular.isDefined;

    $scope.timestamp = new Date();

    // session.today = $scope.timestamp.toISOString().slice(0, 10);
    session.today = util.htmlDate(new Date());


    dependencies.currencies = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol']
          }
        }
      }
    };

    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'abbr']
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
       $scope.session.currency = currency;
    }

    function getAccount (ac) {
      if (!ac) { return; }
       session.configured = true;
       session.ac = ac;
       session.complete = true;
    }

    appstate.register('project', function (project) {
      $scope.project =  project;
      dependencies.projects.query.where =
        ['project.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
        session.receipt.date = new Date();
        session.receipt.cost = 0.00;
        session.receipt.cash_box_id = $routeParams.id;
        session.accounts = models.accounts.data;
      })
      .catch(function (err) {
        messenger.error(err);
      });
    });

    $scope.formatDebtor = function formatDebtor(debtor) {
      return [
        '[' + $scope.projects.get(debtor.project_id).abbr,
        debtor.reference + ']',
        debtor.first_name,
        debtor.last_name
      ].join(' ');
    };

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

    function update (value) {
      session.receipt.recipient = value;
    }

    $scope.$watch('session.receipt', valid, true);
    $scope.$watch('session.currency', valid, true);

    $scope.submit = function submit () {
      var data, receipt = session.receipt;

      connect.fetch('/user_session')
      .then(function (user) {

        data = {
          uuid          : uuid(),
          project_id    : $scope.project.id,
          type          : 'E',
          date          : util.sqlDate(receipt.date),
          account_id    : session.ac.id,
          currency_id   : session.currency.id,
          cost          : receipt.cost,
          user_id       : user.id,
          description   : 'HBB' + '_CP. REC GEN/' + receipt.description, //fix me
          cash_box_id   : receipt.cash_box_id,
          origin_id     : 5,
        };

        return connect.basicPut('primary_cash', [data]);
      })
      .then(function () {
        var item = {
          uuid              : uuid(),
          primary_cash_uuid : data.uuid,
          debit             : data.cost,
          credit            : 0,
          document_uuid     : receipt.reference_uuid
        };
        return connect.basicPut('primary_cash_item', [item]);
      })
      .then(function () {
        return connect.fetch('/journal/primary_income/' + data.uuid);
      })
      .then(function () {
        // invoice
        messenger.success($translate.instant('ALLTRANSACTIONS.DATA_POSTED'));
        $location.path('/invoice/generic_income/' + data.uuid);
      });
    };

    function setCurrency (obj) {
      $scope.session.currency=obj;
      cache.put('currency', obj);
    }

    function formatAccount (ac) {
      if (ac) {return ac.account_number + ' - ' + ac.account_txt;}
    }

    $scope.reconfigure = function () {
      session.ac = null;
      session.configured = false;
      session.complete = false;
    };

    $scope.setConfiguration = function (ac) {
      if (ac) {
        cache.put('account', ac);
        session.configured = true;
        session.ac = ac;
        session.complete = true;
      }
    };

    $scope.update = update;
    $scope.setCurrency = setCurrency;
    $scope.formatAccount = formatAccount;
  }
]);
