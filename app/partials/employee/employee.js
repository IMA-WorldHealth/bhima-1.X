angular.module('kpk.controllers').controller('employee', 
[
  '$scope',
  'validate',
  function ($scope, validate) { 
    var dependencies = {}, session = $scope.session = {};
    var route = $scope.route = { 
      create : 'EMPLOYEE.REGISTER',
      edit : 'EMPLOYEE.EDIT'
    };

    dependencies.employee = { 
      query : { 
        tables : { 
          employee : { columns : ['id', 'creditor_uuid'] } 
        }
      }
    };

    validate.process(dependencies).then(initialise);

    function initialise(model) { 
      angular.extend($scope, model);
    }

    function createEmployee() { 
      session.state = route.create;
      console.log(session.state);
    }

    $scope.createEmployee = createEmployee;
  }
]);
