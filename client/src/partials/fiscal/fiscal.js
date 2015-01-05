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

    // get the enterprise information
    appstate.register('enterprise', buildFiscalQuery);

    function buildFiscalQuery(enterprise) {
      $scope.enterprise = enterprise;
      dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + enterprise.id];
      validate.refresh(dependencies)
      .then(startup);
    }

    function startup(models) {
      angular.extend($scope, models);
    }

    function selectYear(id) {
      $scope.selected = id;
      $scope.active = 'update';
      $scope.$emit('fiscalYearChange', id);
      $scope.$broadcast('fiscalYearChange', id);
    }

    $scope.createFiscalYear = function createFiscalYear() {
      // Do some session checking to see if any values need to be saved/ flushed to server
      $scope.active = 'create';
      $scope.selected = null;
    };

  }
]);
