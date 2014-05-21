angular.module('bhima.controllers')
.controller('analysisCenter', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  'validate',
  '$filter',
  function ($scope, $q, connect, appstate, messenger, validate, $filter) {

    var dependencies= {};

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
    }

    $scope.register = {}; $scope.selected = {};

    function init (model){
      $scope.model = model;
    }

    function setAction (value, cost_center){
      $scope.action = value;
      $scope.selected = angular.copy(cost_center) || {};
      if($scope.selected){
        $scope.selected.is_principal = ($scope.selected.is_principal!=0)? true : false;
      }
    }

    function writeCenter (){
      return connect.basicPut('cost_center', connect.clean($scope.register));
    }

    function saveRegistration (){
      $scope.register.project_id = $scope.project.id;
      $scope.register.is_principal = ($scope.register.is_principal)? 1 : 0;
      writeCenter()
      .then(function(){
        // FIXME just add employee to model
        validate.refresh(dependencies, ['cost_centers']).then(function (model) {
          angular.extend($scope, model);
        });

        $scope.register = {};

        messenger.success($filter('translate')('ANALYSIS_CENTER.INSERT_SUCCESS_MESSAGE'));
      })
      .catch(function(err){
        messenger.danger($filter('translate')('ANALYSIS_CENTER.INSERT_FAIL_MESSAGE'));
      })
    }

    function getAvailablesAccounts (enterprise_id){
      var def = $q.defer();
      connect.fetch('/availablechargeAccounts/'+enterprise_id+'/')
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function loadAssociateAccounts (){
      var def = $q.defer();
      connect.fetch('/costCenterAccount/'+enterprise.id+'/'+$scope.selected.id)
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function handleConfigure(){
      loadAssociateAccounts()
      .then(function(values){
        models.associatedAccounts = values;
        transformDatas(models.associatedAccounts);

      });
    }

    function remove(cost_center){
      $scope.selected = angular.copy(cost_center);
      removeCostcenter()
      .then(function (){
        $scope.model.cost_centers.remove($scope.selected.id);
        messenger.success($filter('translate')('ANALYSIS_CENTER.REMOVE_SUCCESS_MESSAGE'));
      })
      .catch(function (err){
        messenger.danger($filter('translate')('ANALYSIS_CENTER.REMOVE_FAIL_MESSAGE'));
      });

    }

    function edit (){
      $scope.selected.is_principal = ($scope.selected.is_principal)? 1 : 0;
      delete $scope.selected.abbr;
      updateCostCenter()
      .then(function () {
        // FIXME just add employee to model
        $scope.model.cost_centers.put($scope.selected);
        messenger.success($filter('translate')('ANALYSIS_CENTER.UPDATE_SUCCESS_MESSAGE'));

      })
      .catch(function(err){
        messenger.danger($filter('translate')('ANALYSIS_CENTER.UPDATE_FAIL_MESSAGE'));
      })
    }

    function removeCostcenter (){
      return connect.basicDelete('cost_center', [$scope.selected.id], 'id');
    }

    function updateCostCenter (){
      return connect.basicPost('cost_center', [connect.clean($scope.selected)], ['id']);
    }

    appstate.register('project', function (project){
      $scope.project = project;
      dependencies.cost_centers.where = ['cost_center.project_id='+project.id];
      validate.process(dependencies).then(init);
    })


    $scope.setAction = setAction;
    $scope.saveRegistration = saveRegistration;
    $scope.remove = remove;
    $scope.edit = edit;

  }
]);
