angular.module('bhima.controllers').controller('service', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'uuid',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $q, $translate, validate, uuid, messenger, connect, appstate) {
    var dependencies = {}, cost_center = {}, service ={};
    $scope.choosen = {};

    dependencies.services = {
      query : {
        tables : {
          'service' : {
            columns : ['id', 'name', 'cost_center_id']
          },
          'cost_center' : {
            columns : ['text']
          }
        },
        join : ['service.cost_center_id=cost_center.id']
      }
    }

    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text']
          }
        }
      }
    }

    function init (model){
      $scope.model = model;
      console.log(model);
    }

    function save (){
      writeService()
      .then(function (result){
        // FIXME just add service to model
        validate.refresh(dependencies, ['services']).then(function (model) {
          angular.extend($scope, model);
          messenger.success($translate('SERVICE.INSERT_SUCCESS_MESSAGE'));
        });

        $scope.service = {};
      })
      .catch(function (err) {
        messenger.danger($translate('SERVICE.INSERT_FAIL_MESSAGE'));
      })
    }

    function writeService () {
      return connect.basicPut('service', [connect.clean($scope.service)]);
    }

    function setAction (value, service){
      $scope.choosen = angular.copy(service) || {};
      if(value == 'more'){
        getCost($scope.choosen.cost_center_id)
        .then(handleResultCost)
        .then(getProfit)
        .then(handleResultProfit)
        .then(function (){
          $scope.action = value;
          console.log('object donne : ', $scope.choosen);
        })
      }else{
        //$scope.choosen.cost_center_id = value.id;
        $scope.action = value;
      }
    }

    function getProfit (model){
      var def = $q.defer();
      connect.req('/profit/'+$scope.project.id+'/'+$scope.choosen.id)
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function handleResultProfit (){

    }

    function edit (){
      console.log('le voici', connect.clean($scope.choosen));
      var data = {
        id : $scope.choosen.id,
        name : $scope.choosen.name,
        cost_center_id : $scope.choosen.cost_center_id
      }

      connect.basicPost('service', [data], ['id'])
      .then(function (res) {
        $scope.model.services.put(connect.clean($scope.choosen));
        $scope.action = '';
        $scope.choosen = {}; // reset
      })
      .catch(function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      })
    }

    function handleResultCost (value){
      $scope.choosen.charge = value.data.cost;
      return $q.when();
    }

    function handleResultProfit (value){
      $scope.choosen.profit = value.data.profit;
      return $q.when();
    }

    function getCost (cc_id){
      var def = $q.defer();
      connect.req('/cost/'+$scope.project.id+'/'+cc_id)
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function removeService (){
      return connect.basicDelete('service', [$scope.choosen.id], 'id');
    }

    function remove (service){
      $scope.choosen = angular.copy(service);
      removeService()
      .then(function (){
        $scope.model.services.remove($scope.choosen.id);
        messenger.success($translate('SERVICE.REMOVE_SUCCESS_MESSAGE'));
      })
      .catch(function (err){
        messenger.danger($translate('SERVICE.REMOVE_FAIL_MESSAGE'));
      });
    }

    appstate.register('project', function (project){
      validate.process(dependencies)
      .then(init);
    })

    $scope.save = save;
    $scope.service = service;
    $scope.cost_center = cost_center;
    $scope.setAction = setAction;
    $scope.edit = edit;
    $scope.remove = remove;
  }
]);
