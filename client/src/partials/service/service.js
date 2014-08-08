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

    var configuration = $scope.configuration = {};


    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr', 'enterprise_id']
          }
        }
      }
    };

    dependencies.costs = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    dependencies.profits = {
      query : {
        tables : {
          'profit_center' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    dependencies.services = {
      query :'/services/'
    };

    dependencies.cost_centers = {
      query : '/available_cost_center/'
    };

    dependencies.profit_centers = {
      query : '/available_profit_center/'
    };

    function init (model) {
      console.log(model);
      $scope.model = model;
      configuration.cost_centers = model.cost_centers.data;
      configuration.profit_centers = model.profit_centers.data;
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
      }else if (value === 'edit'){
        configuration.cost_centers = $scope.model.costs.data;
        configuration.profit_centers = $scope.model.profits.data;
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

    function filterCenters (id) {

      configuration.cost_centers = $scope.model.cost_centers.data.filter(function (item) {
        return item.project_id === id;
      });

      configuration.profit_centers = $scope.model.profit_centers.data.filter(function (item) {
        return item.project_id === id;
      });
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(init)
      .catch(function (err) {
        console.log('Error', err);
      });
    });

    $scope.save = save;
    $scope.service = service;
    $scope.cost_center = cost_center;
    $scope.setAction = setAction;
    $scope.edit = edit;
    $scope.remove = remove;
    $scope.filterCenters = filterCenters;
  }
]);
