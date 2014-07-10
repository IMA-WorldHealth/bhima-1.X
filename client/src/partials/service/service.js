angular.module('bhima.controllers')
.controller('service', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $q, $translate, validate, messenger, connect, appstate) {
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
    };

    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    function init(model) {
      $scope.model = model;
    }

    function save() {
      writeService()
      .then(function () {
        // FIXME just add service to model
        validate.refresh(dependencies, ['services'])
        .then(function (model) {
          angular.extend($scope, model);
          messenger.success($translate.instant('SERVICE.INSERT_SUCCESS_MESSAGE'));
        });

        $scope.service = {};
      })
      .catch(function () {
        messenger.danger($translate.instant('SERVICE.INSERT_FAIL_MESSAGE'));
      });
    }

    function writeService () {
      return connect.basicPut('service', [connect.clean($scope.service)]);
    }

    function setAction (value, service) {
      $scope.choosen = angular.copy(service) || {};
      if (value === 'more') {
        getCost($scope.choosen.cost_center_id)
        .then(handleResultCost)
        .then(getProfit)
        .then(handleResultProfit);
      }
      $scope.action = value;
    }

    function getProfit() {
      return connect.req('/profit/' + $scope.project.id + '/' + $scope.choosen.id);
    }

    function edit() {
      var data = {
        id             : $scope.choosen.id,
        name           : $scope.choosen.name,
        cost_center_id : $scope.choosen.cost_center_id
      };

      connect.basicPost('service', [data], ['id'])
      .then(function () {
        $scope.model.services.put(connect.clean($scope.choosen));
        $scope.action = '';
        $scope.choosen = {}; // reset
      })
      .catch(function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      });
    }

    function handleResultCost(value) {
      $scope.choosen.charge = value.data.cost;
      return $q.when();
    }

    function handleResultProfit(value) {
      $scope.choosen.profit = value.data.profit;
      return $q.when();
    }

    function getCost(ccId) {
      return connect.req('/cost/' + $scope.project.id + '/' + ccId);
    }

    function removeService() {
      return connect.basicDelete('service', [$scope.choosen.id], 'id');
    }

    function remove(service) {
      $scope.choosen = angular.copy(service);
      removeService()
      .then(function () {
        $scope.model.services.remove($scope.choosen.id);
        messenger.success($translate.instant('SERVICE.REMOVE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('SERVICE.REMOVE_FAIL_MESSAGE'));
      });
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(init);
    });

    $scope.save = save;
    $scope.service = service;
    $scope.cost_center = cost_center;
    $scope.setAction = setAction;
    $scope.edit = edit;
    $scope.remove = remove;
  }
]);
