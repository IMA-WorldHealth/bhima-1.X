angular.module('bhima.controllers')
.controller('fiscal', [
  '$scope',
  'appstate',
  'validate',
  function ($scope, appstate, validate) {
    var dependencies = {};

    // register dependencies
    dependencies.fiscal = {
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'fiscal_year_txt', 'start_month', 'start_year']
          }
        }
      }
    };

    // expose bindings to the view
    $scope.selectYear = selectYear;

    // start up the module
    function startup(enterprise) {
      $scope.enterprise = enterprise;
      dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + enterprise.id];
      validate.refresh(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
      });
    }

    // select a fiscal year for editting
    function selectYear(id) {
      $scope.selected = id;
      $scope.active = 'update';
      $scope.$broadcast('fiscal-year-selection-change', id);
    }

    // activate create template and deselect selection
    $scope.createFiscalYear = function createFiscalYear() {
      $scope.active = 'create';
      $scope.selected = null;
    };

    // listen for create event and refresh fiscal year data
    $scope.$on('fiscal-year-creation', function (e, id) {
      startup($scope.enterprise);
    });

    // get the enterprise information and startup
    appstate.register('enterprise', startup);
  }
]);
