angular.module('bhima.controllers')
.controller('enterprise', [
  '$scope',
  '$window',
  'connect',
  'validate',
  'appstate',
  function ($scope, $window, connect, validate, appstate) {
    var dependencies = {};

    dependencies.enterprise = {
      required : true,
      query : {
        tables : {
          'enterprise' : {
            columns : ['id', 'name', 'abbr', 'email', 'phone', 'location_id', 'logo', 'currency_id']
          }
        }
      }
    };

    dependencies.currency = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol', 'name']
          }
        }
      }
    };

    dependencies.location = {
      query : '/location/'
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.globalEnterprise = enterprise;
      validate.process(dependencies)
      .then(initialize);
    });

    function initialize (models) {
      //model.dependences = models[0];
      //$scope.location = models[1];
      angular.extend($scope, models);
      $scope.newAccount = {};
    }

    $scope.formatLocation = function fLocation (l) {
      return [l.village, l.sector, l.province, l.country].join(' -- ');
    };

    $scope.newEnterprise = function () {
      $scope.add = {};
      $scope.action = 'new';
    };

    $scope.editEnterprise = function (enterprise) {
      $scope.edit = angular.copy(enterprise);
      $scope.editing_enterprise = enterprise;
      $scope.action = 'edit';
    };

    $scope.saveEdit = function () {
      var data = connect.clean($scope.edit);

      connect.basicPost('enterprise', [data], ['id'])
      .then(function () {
        $scope.enterprise.put(data);
        $scope.action = '';

        // we should reset the global enterprise variable
        // if we have updated the global enterprise data
        if (data.id === $scope.globalEnterprise.id) {
          appstate.set('enterprise', $scope.enterprise.get(data.id));
        }

      });
    };

    $scope.resetEdit = function () {
      $scope.edit = angular.copy($scope.editing_enterprise);
    };

    $scope.saveNew = function () {
      var data = connect.clean($scope.add);

      connect.basicPut('enterprise', [data])
      .then(function (res) {
        data.id = res.data.insertId;
        $scope.enterprise.post(data);
        $scope.action = '';
      });
    };

    $scope.resetNew = function () {
      $scope.add = {};
    };

    $scope.print = function () { $window.print(); };

  }
]);
