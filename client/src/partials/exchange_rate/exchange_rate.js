angular.module('bhima.controllers')
.controller('exchangeRate', [
  '$scope',
  'connect',
  'messenger',
  'appstate',
  'validate',
  'exchange',
  'util',
  function ($scope, connect, messenger, appstate, validate, exchange, util) {
    var dependencies = {};
    var session = $scope.session = {};

    dependencies.currency = {
      required : true,
      query : {
        tables : {
          'currency' : { 'columns' : ['id', 'name', 'symbol', 'note']
          }
        }
      }
    };

    dependencies.rates = {
      query : {
        tables : {
          'exchange_rate' : {
            'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
          }
        }
      }
    };

    $scope.maxDate = util.htmlDate(new Date());
    session.is_oldDate = false;
    session.oldDate = new Date();

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies).then(buildModels, handleError);
    });

    appstate.register('exchange_rate', function (rates) {
      $scope.globalRates = rates;
    });

    function handleError(err) {
      messenger.danger('An error occured' + JSON.stringify(err));
    }

    function buildModels(models) {
      angular.extend($scope, models);
      $scope.today = new Date().toISOString().slice(0, 10);
      $scope.newRate = {};
    }

    $scope.$watch('rates.data', function () {
      if (!$scope.rates) { return; }
      $scope.currentRates = $scope.rates.data.filter(function (rate) {
        return new Date(rate.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
      });
    }, true);

    $scope.submit = function () {
      $scope.today = (session.is_oldDate) ? util.htmlDate(new Date(session.oldDate)) : new Date().toISOString().slice(0, 10);

      var data = {
        enterprise_currency_id : $scope.enterprise.currency_id,
        foreign_currency_id    : $scope.newRate.foreign_currency_id,
        rate                   : $scope.newRate.rate / 100.0,
        date                   : $scope.today
      };

      connect.basicPut('exchange_rate', [data])
      .then(function (result) {
        // set global exchange rate
        if ($scope.globalRates.length) {
          $scope.globalRates.push(data);
        } else {
          $scope.globalRates = [data];
        }

        appstate.set('exchange_rate', $scope.globalRates);
        exchange.forceRefresh();

        // add to store
        data.id = result.data.insertId;
        $scope.rates.post(data);

        // reset rate
        $scope.action = '';
        $scope.newRate = {};
      }, function (err) {
        if (err.status === 404) {
          messenger.error('ERR_HTTP_UNREACHABLE');
        }
      });
    };

    $scope.fcurrency = function (currency) {
      return currency.id !== $scope.enterprise.currency_id;
    };

    $scope.commitValue = function (){
      $scope.is_oldDate = !$scope.is_oldDate;
    };

    $scope.checkValidity = function (){
      return ($scope.newRate.rate && $scope.newRate.rate > 0 && $scope.newRate.foreign_currency_id) ? false : true;
    }

  }
]);
