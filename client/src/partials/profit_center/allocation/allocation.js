angular.module('bhima.controllers')
.controller('profitCenter.allocation', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'validate',
  'SessionService',
  function ($scope, $q, connect, appstate,validate, SessionService) {

    var dependencies = {},
        configuration = $scope.configuration = {};

    dependencies.profit_centers = {
      query : {
        tables : {
          'profit_center' : {
            columns : ['id', 'text', 'note']
          }
        }
      }
    };

    startup();

    function startup() {
      $scope.project = SessionService.project;
      validate.process(dependencies)
      .then(init);
    }

    function init(models) {
      angular.extend($scope, models);
      $scope.acc_1 = { all : false };
      $scope.acc_2 = { all : false };

      connect.req('/availableAccounts_profit/' + $scope.project.enterprise_id + '/')
      .then(function (records) {
        $scope.availableAccounts = records;
      });
    }

    function checkAllAvailable() {
      $scope.availableAccounts.data.forEach(function (item) {
        item.checked = $scope.acc_1.all;
      });
    }

    function checkAllAssociated() {
      $scope.associatedAccounts.data.forEach(function (item) {
        item.checked = $scope.acc_2.all;
      });
    }

    function performChange() {
      $scope.selectedProfitCenter = JSON.parse(configuration.profitCenter);
      loadCenterAccount()
      .then(function (results) {
        $scope.associatedAccounts = results;
      });
    }

    function assign() {
      var accounts = sanitize(); // accounts to associate
      updateAccounts(accounts)
      .then(function () {
        $scope.selectedAccounts.forEach(function (item) {
          $scope.availableAccounts.remove(item.id);
          item.checked = false;
          $scope.associatedAccounts.post(item);
        });
      });
    }

    function remove() {
      // finds all accounts marked for removal and removes them
      var marked = filterSelectedInArray($scope.associatedAccounts.data);
      removeFromProfitCenter(marked)
      .then(function () {
        marked.forEach(function (account) {
          $scope.associatedAccounts.remove(account.id);
          $scope.availableAccounts.post(account);
        });
      });
    }

    function filterSelectedInArray(array) {
      return array.filter(function (item) {
        return item.checked;
      });
    }

    function removeFromProfitCenter (data) {
      return connect.req('/removeFromProfitCenter/'+JSON.stringify(data));
    }

    function updateAccounts(accounts) {
      return $q.all(
        accounts.map(function (account) {
          return connect.basicPost('account', [account], ['id']);
        })
      );
    }

    function sanitize () {
      $scope.selectedAccounts = filterSelectedInArray($scope.availableAccounts.data);
      return $scope.selectedAccounts.map(function (account) {
        return { pc_id : $scope.selectedProfitCenter.id, id : account.id };
      });
    }

    function loadCenterAccount () {
      return connect.req('/profitCenterAccount/'+ $scope.project.enterprise_id + '/'+$scope.selectedProfitCenter.id);
    }

    function hasSelectedItems(array) {
      return array.some(function (item) {
        return item.checked;
      });
    }

    function isAssignable () {
      if (!configuration.profitCenter) { return false; }
      if (!$scope.availableAccounts.data.length) { return false; }
      return hasSelectedItems($scope.availableAccounts.data);
    }

    function isRemovable () {
      if (!configuration.profitCenter) { return false; }
      if (!$scope.associatedAccounts) { return false; }
      if (!$scope.associatedAccounts.data.length) { return false; }
      return hasSelectedItems($scope.associatedAccounts.data);
    }

    $scope.checkAllAvailable = checkAllAvailable;
    $scope.checkAllAssociated = checkAllAssociated;
    $scope.performChange = performChange;
    $scope.assign = assign;
    $scope.remove = remove;
    $scope.isAssignable = isAssignable;
    $scope.isRemovable = isRemovable;
  }
]);
