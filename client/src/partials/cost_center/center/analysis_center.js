angular.module('bhima.controllers')
.controller('analysisCenter', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  'validate',
  '$translate',
  'SessionService',
  function ($scope, connect, appstate, messenger, validate, $translate, SessionService) {

    var dependencies = {},
        session = $scope.session = {};

    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note', 'is_principal']
          }
        }
      }
    };

    $scope.register = {};
    $scope.selected = {};

    startup();

    function startup() {
      session.state = 'loading';
      $scope.enterprise = SessionService.enterprise;
      validate.process(dependencies).then(init);
    }

    function init(model) {
      $scope.model = model;
      session.state = 'loaded';
    }

    function setAction(value, cost_center) {
      $scope.action = value;
      $scope.selected = angular.copy(cost_center) || {};
      $scope.selected.is_principal = $scope.selected.is_principal !== 0;
    }

    function writeCenter() {
      return connect.post('cost_center', connect.clean($scope.register));
    }

    function saveRegistration() {
      $scope.register.is_principal = ($scope.register.is_principal)? 1 : 0;
      writeCenter()
      .then(function() {
        validate.refresh(dependencies, ['cost_centers']).then(function (model) {
          angular.extend($scope, model);
        });

        $scope.register = {};
        $scope.action = 'default';
        messenger.success($translate.instant('ANALYSIS_CENTER.INSERT_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_CENTER.INSERT_FAIL_MESSAGE'));
      });
    }

    function remove(cost_center) {
      $scope.selected = angular.copy(cost_center);
      removeCostcenter()
      .then(function () {
        $scope.model.cost_centers.remove($scope.selected.id);
        messenger.success($translate.instant('ANALYSIS_CENTER.REMOVE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        var msg = $translate.instant('ANALYSIS_CENTER.REMOVE_FAIL_MESSAGE').replace('%VAR%', $scope.selected.text);
        messenger.error(msg);
      });

    }

    function edit() {
      $scope.selected.is_principal = ($scope.selected.is_principal)? 1 : 0;
      delete $scope.selected.abbr;
      updateCostCenter()
      .then(function () {
        $scope.model.cost_centers.put($scope.selected);
        $scope.selected = {};
        $scope.action = 'default';
        messenger.success($translate.instant('ANALYSIS_CENTER.UPDATE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.error($translate.instant('ANALYSIS_CENTER.UPDATE_FAIL_MESSAGE'));
      });
    }

    function removeCostcenter() {
      return connect.delete('cost_center', 'id', [$scope.selected.id]);
    }

    function updateCostCenter() {
      return connect.put('cost_center', [connect.clean($scope.selected)], ['id']);
    }

    $scope.setAction = setAction;
    $scope.saveRegistration = saveRegistration;
    $scope.remove = remove;
    $scope.edit = edit;
  }
]);
