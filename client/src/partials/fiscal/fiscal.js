angular.module('bhima.controllers')
.controller('fiscal', [
  '$scope',
  '$modal',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function ($scope, $modal, connect, appstate, messenger, validate) {
    var dependencies = {};

    dependencies.fiscal = {
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'fiscal_year_txt', 'start_month', 'start_year']
          }
        }
      }
    };

    appstate.register('enterprise', buildFiscalQuery);

    function buildFiscalQuery(enterprise) {
      var enterpriseId = $scope.enterpriseId = enterprise.id;
      $scope.enterprise = enterprise;
      dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + enterpriseId];
      validate.refresh(dependencies)
      .then(fiscal);
    }

    function fiscal(model) {
      $scope.model = model;
    }

    $scope.select = function (fiscalId) {
      if ($scope.model.fiscal) {
        $scope.selected = $scope.model.fiscal.get(fiscalId);
        $scope.active = 'update';
      }
    };

    $scope.delete = function (fiscalId) {
      // validate deletion before performing
      $scope.active = 'select';
      $scope.selected = null;
      $scope.model.fiscal.delete(fiscalId);
    };

    $scope.isSelected = function isSelected() {
      return !!$scope.selected;
    };

    $scope.createFiscalYear = function createFiscalYear() {
      // Do some session checking to see if any values need to be saved/ flushed to server
      $scope.active = 'create';
      $scope.selected = null;
    };

    $scope.getFiscalStart = function getFiscalStart() {
      if ($scope.periodModel && $scope.periodModel[0]) {
        return $scope.periodModel[0].period_start;
      }
    };

    $scope.getFiscalEnd = function () {
      if ($scope.periodModel) {
        var l = $scope.periodModel;
        var t = l[l.length-1];
        if (t) {
          return t.period_stop;
        }
      }
    };
  }
]);
