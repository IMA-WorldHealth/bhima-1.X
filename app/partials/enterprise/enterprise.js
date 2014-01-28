angular.module('kpk.controllers')
.controller('enterpriseController', [
  '$scope',
  '$q',
  'connect',
  'validate',
  'messenger',
function ($scope, $q, connect, validate, messenger) {
  var flags = $scope.flags = {};

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
    required : true,
    query : '/location/'
  };

  validate.process(dependencies).then(initialize, handleError);
  
  function initialize (models) {
    for (var k in models) $scope[k] = models[k];
  }

  function handleError (error) {
    messenger.danger('An error occured in fetching requests: ' + JSON.stringify(error)); 
  }

  $scope.formatLocation = function formatLocation (l) {
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
    .then(function (res) {
      $scope.enterprise.put(edit);
    }, function (err) {
      messenger.danger('Error updating enterprise ' + data.id + ':' + JSON.stringify(err));
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
    }, function (err) {
      messenger.danger('Error in saving new enterprise:' + JSON.stringify(err));
    });
  };
  
  $scope.resetNew = function () {
    $scope.add = {}; 
  };

}]);
