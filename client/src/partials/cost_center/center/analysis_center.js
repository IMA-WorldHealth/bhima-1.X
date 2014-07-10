angular.module('bhima.controllers')
.controller('analysisCenter', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  'validate',
  '$translate',
  function ($scope, connect, appstate, messenger, validate, $translate) {

    var dependencies = {};

    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note', 'is_principal', 'project_id']
          },
          'project' : {
            columns :['abbr']
          }
        },
        join : ['cost_center.project_id=project.id']
      }
    };

    $scope.register = {};
    $scope.selected = {};

    function init(model) {
      $scope.model = model;
    }

    function setAction(value, cost_center) {
      $scope.action = value;
      $scope.selected = angular.copy(cost_center) || {};
      $scope.selected.is_principal = $scope.selected.is_principal !== 0;
    }

    function writeCenter() {
      return connect.basicPut('cost_center', connect.clean($scope.register));
    }

    function saveRegistration() {
      $scope.register.project_id = $scope.project.id;
      $scope.register.is_principal = ($scope.register.is_principal)? 1 : 0;
      writeCenter()
      .then(function() {
        // FIXME just add employee to model
        validate.refresh(dependencies, ['cost_centers']).then(function (model) {
          angular.extend($scope, model);
        });

        $scope.register = {};

        messenger.success($translate.instant('ANALYSIS_CENTER.INSERT_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_CENTER.INSERT_FAIL_MESSAGE'));
      });
    }

    /*
    function getAvailablesAccounts(enterprise_id) {
      return connect.fetch('/availablechargeAccounts/'+$scope.project.enterprise_id+'/');
    }

    function loadAssociateAccounts() {
      return connect.fetch('/costCenterAccount/' + $scope.proejct.enterprise_id + '/' + $scope.selected.id);
    }

    function handleConfigure() {
      loadAssociateAccounts()
      .then(function (values) {
        models.associatedAccounts = values;
        transformDatas(models.associatedAccounts);
      });
    }
    */

    function remove(cost_center) {
      $scope.selected = angular.copy(cost_center);
      removeCostcenter()
      .then(function () {
        $scope.model.cost_centers.remove($scope.selected.id);
        messenger.success($translate.instant('ANALYSIS_CENTER.REMOVE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_CENTER.REMOVE_FAIL_MESSAGE'));
      });

    }

    function edit() {
      $scope.selected.is_principal = ($scope.selected.is_principal)? 1 : 0;
      delete $scope.selected.abbr;
      updateCostCenter()
      .then(function () {
        // FIXME just add employee to model
        $scope.model.cost_centers.put($scope.selected);
        messenger.success($translate.instant('ANALYSIS_CENTER.UPDATE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_CENTER.UPDATE_FAIL_MESSAGE'));
      });
    }

    function removeCostcenter() {
      return connect.basicDelete('cost_center', [$scope.selected.id], 'id');
    }

    function updateCostCenter() {
      return connect.basicPost('cost_center', [connect.clean($scope.selected)], ['id']);
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.cost_centers.where = ['cost_center.project_id='+project.id];
      validate.process(dependencies).then(init);
    });

    $scope.setAction = setAction;
    $scope.saveRegistration = saveRegistration;
    $scope.remove = remove;
    $scope.edit = edit;
  }
]);
