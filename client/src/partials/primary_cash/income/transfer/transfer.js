angular.module('bhima.controllers')
.controller('primaryCash.income.transfer', [
  '$scope',
  'connect',
  'validate',
  'appstate',
  'util',
  'uuid',
  '$routeParams',
  '$location',
  'exchange',
  '$modal',
  function ($scope, connect, validate, appstate, util, uuid, $routeParams, $location, exchange, $modal) {
    var dependencies = {},
        data = $scope.data = {};

    var pcash_box_id = $routeParams.cashbox_id;

    var moduleQuery = {
      tables : {
        'primary_cash_module' : {
          columns : ['id']
        }
      },
      where : ['primary_cash_module.text=transfert']
    };

    // TODO : this should just load from appstate
    dependencies.projects = {
      required : true,
      query : {
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr', 'enterprise_id']
          }
        }
      }
    };

    dependencies.cash_boxes = {
      required : true,
      query : {
        tables : {
          'cash_box' : {
            columns : ['id', 'text', 'project_id', 'is_auxillary', 'is_bank']
          },
        }
      }
    };

    dependencies.cash_box_account_currencies = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : { columns : ['id', 'currency_id', 'account_id', 'cash_box_id'] }
        }
      }
    };

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol'] // TODO: including min_monentary unit and then doing validation checks based on it.
          }
        }
      }
    };

    function startup(model) {
      haltOnNoExchange();
      angular.extend($scope, model);
    }

    $scope.labelCurrency = function (id) {
      if (!angular.isDefined(id)) { return '...'; }
      return $scope.currencies.get(id).symbol || '{ERR}';
    };

    function getAccount(currencyId, cashBoxId) {
      var accountId;
      $scope.cash_box_account_currencies.data.forEach(function (box) {
        // FIXME I changed box.cash_box_id == cashBoxId to a strict equality.  Does it still hold?
        if (box.currency_id == currencyId && box.cash_box_id == cashBoxId) {
          accountId = box.account_id;
        }
      });
      return accountId;
    }

    $scope.submit = function submit() {
      var pcash, item, accountId, date = util.sqlDate();

      accountId = getAccount(data.currency_id, data.cash_box_id);
      if (!accountId) { throw 'NO ACCOUNT'; }

      pcash = {
        uuid        : uuid(),
        project_id  : data.project_id,
        type        : 'E',
        date        : date,
        currency_id : data.currency_id,
        account_id  : accountId,
        cost        : data.value,
        description : 'Caisse Transfert/' + date,
        cash_box_id : pcash_box_id
      };

      // fetch module id
      connect.fetch(moduleQuery)
      .then(function (data) {
        // fetch the user id
        pcash.origin_id = data[0].id;
        return connect.fetch('/user_session');
      })
      .then(function (data) {
        // post primary_cash record line
        pcash.user_id = data.id;
        return connect.post('primary_cash', pcash);
      })
      .then(function () {
        // create and post primary_cash_item record line
        item = {
          uuid              : uuid(),
          primary_cash_uuid : pcash.uuid,
          debit             : data.value,
          document_uuid     : pcash.uuid,
          credit            : 0 // LOL wot?
        };
        return connect.post('primary_cash_item', item);
      })
      .then(function () {
        // post to journal
        return connect.fetch('/journal/transfert/' + pcash.uuid);
      })
      .then(function () {
        // navigate to invoice
        $location.path('/invoice/pcash_transfert/' + pcash.uuid);
      })
      .finally();
    };

    function haltOnNoExchange () {
      if (exchange.hasDailyRate()) { return; }

      var instance = $modal.open({
        templateUrl : 'partials/exchangeRateModal/exchangeRateModal.html',
        backdrop    : 'static',
        keyboard    : false,
        controller  : 'exchangeRateModal'
      });
      
      instance.result.then(function () {
        $location.path('/exchange_rate');
      }, function () {
        $scope.errorState = true;
      });
    }

    appstate.register('project', function (project) {
      data.project_id = project.id;
      validate.process(dependencies)
      .then(startup);
    });
  }
]);
