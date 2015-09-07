angular.module('bhima.controllers')
.controller('fiscal', [
  '$scope',
  'appstate',
  'validate',
  'SessionService',
  function ($scope, appstate, validate, sessionService) {
    var dependencies = {};

    $scope.user = sessionService.user;

    // register dependencies
    dependencies.fiscal = {
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'locked']
          }
        }
      }
    };

    // expose bindings to the view
    $scope.selectYear = selectYear;
    $scope.selectLock = selectLock;

    // start up the module
    function startup() {
      $scope.enterprise = sessionService.enterprise;
      dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + $scope.enterprise.id];
      validate.refresh(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
      });
    }

    // select a fiscal year for editting
    function selectYear(id) {
      $scope.selectedToLock = null; // Skip selected for lock style
      $scope.selected = id;
      $scope.active = 'update';
      $scope.$broadcast('fiscal-year-selection-change', id);
    }

    // select a fiscal year for lock
    function selectLock(id) {
      $scope.selected = null; // Skip selected for update style
      $scope.selectedToLock = id;
      $scope.active = 'lock';
      $scope.$broadcast('fiscal-year-selection-lock-change', id);
    }

    // activate create template and deselect selection
    $scope.createFiscalYear = function createFiscalYear() {

      // FIXME : force refresh when clicking the button multiple
      // times.
      $scope.$broadcast('fiscal-year-create-refresh');

      $scope.active = 'create';
      $scope.selected = null;
      $scope.selectedToLock = null;
    };

    // listen for create event and refresh fiscal year data
    $scope.$on('fiscal-year-creation', function (e, id) {
      startup();
    });

    startup();
  }
]);
