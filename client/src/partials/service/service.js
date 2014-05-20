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

    dependencies.services = {
      query : {
        tables : {
          'service' : {
            columns : ['id', 'name']
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
    }

    function save (){
      writeService()
      .then(function (result){
        // FIXME just add service to model
        validate.refresh(dependencies, ['services']).then(function (model) {
          angular.extend($scope, model);
          messenger.success($filter('translate')('SERVICE.INSERT_SUCCESS_MESSAGE'));
        });

        $scope.service = {};
      })
      .catch(function (err) {
        messenger.danger($filter('translate')('SERVICE.INSERT_FAIL_MESSAGE'));
      })
    }

    function writeService () {
      return connect.basicPut('service', [connect.clean($scope.service)]);
    }

    function setAction (value, service){
      $scope.action = value;
      $scope.selected = angular.copy(service) || {};
      console.log('selected', service);
    }

    appstate.register('project', function (project){
      validate.process(dependencies)
      .then(init);
    })

    $scope.save = save;
    $scope.service = service;
    $scope.cost_center = cost_center;
    $scope.setAction = setAction;
  }
]);
