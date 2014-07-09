angular.module('bhima.controllers')
.controller('costCenter.allocation', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'validate',
  function ($scope, $q, connect, appstate,validate) {

    var dependencies= {},
        configuration = {};

    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note']
          },
          'project' : {
            columns :['name']
          }
        },
        join : ['cost_center.project_id=project.id']
      }
    };

    function init(model) {
      $scope.model = model;
      $scope.acc_1 = {};
      $scope.acc_1.all = false;
      $scope.acc_2 = {};
      $scope.acc_2.all = false;

      connect.req('/availableAccounts/' + $scope.project.enterprise_id + '/')
      .then(function (records) {
        $scope.model.available_accounts = records;
      });
    }

    function checkAllAvailable() {
      $scope.model.available_accounts.data.forEach(function (item) {
        item.checked = $scope.acc_1.all;
      });
    }

    function checkAllAssociated() {
      $scope.model.associatedAccounts.data.forEach(function (item) {
        item.checked = $scope.acc_2.all;
      });
    }

    function performChange() {
      $scope.selected_cost_center = JSON.parse($scope.configuration.cost_center);
      loadCenterAccount()
      .then(function (results) {
        $scope.model.associatedAccounts = results;
      });
    }

    function assign() {
      var accounts = sanitize(); // accounts to associate
      updateAccounts(accounts)
      .then(function () {
        $scope.selectedAccounts.forEach(function (item) {
          $scope.model.available_accounts.remove(item.id);
          item.checked = false;
          $scope.model.associatedAccounts.post(item);
        });
      });
    }

    function remove() {
      // finds all accounts marked for removal and removes them
      var marked = filterSelectedInArray($scope.model.associatedAccounts.data);
      removeFromCostCenter(marked)
      .then(function () {
        $scope.tabs.forEach(function (account) {
          $scope.model.associatedAccounts.remove(account.id);
        });
      });
    }

    function filterSelectedInArray(array) {
      return array.filter(function (item) {
        return item.checked;
      });
    }


    function removeFromCostCenter(data) {
      return connect.req('/removeFromCostCenter/'+JSON.stringify(data));
    }

    function updateAccounts(accounts) {
      return $q.all(
        accounts.map(function (account) {
          return connect.basicPost('account', [account], ['id']);
        })
      );
    }

    function sanitize () {
      $scope.selectedAccounts = filterSelectedInArray($scope.model.available_accounts.data);
      return $scope.selectedAccounts.map(function (account) {
        return { cc_id : $scope.selected_cost_center.id, id : account.id };
      });
    }

    function loadCenterAccount () {
      return connect.req('/costCenterAccount/'+ $scope.project.enterprise_id + '/'+$scope.selected_cost_center.id);
    }

    function hasSelectedItems(array) {
      return array.some(function (item) {
        return item.checked;
      });
    }

    function isAssignable () {
      if (!configuration.cost_center) { return false; }
      if (!$scope.model.available_accounts.data.length) { return false; }
      return hasSelectedItems($scope.model.available_accounts.data);
    }

    function isRemovable () {
      if (!configuration.cost_center) { return false; }
      if (!$scope.model.associatedAccounts) { return false; }
      if (!$scope.model.associatedAccounts.data.length) { return false; }
      return hasSelectedItems($scope.model.associatedAccounts.data);
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(init);
    });

    $scope.checkAllAvailable = checkAllAvailable;
    $scope.checkAllAssociated = checkAllAssociated;
    $scope.performChange = performChange;
    $scope.configuration = configuration;
    $scope.assign = assign;
    $scope.remove = remove;
    $scope.isAssignable = isAssignable;
    $scope.isRemovable = isRemovable;
  }
]);
